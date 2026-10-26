package com.pasa.backend.storage;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.InputStream;
import java.net.URI;

/**
 * S3-compatible storage backed by the configured endpoint (Supabase storage).
 *
 * <p>The underlying {@link S3Client} is created lazily on first use so that the bean
 * (and the Spring context) can start even when no storage config is present — this keeps
 * the H2-backed startup smoke test green.
 */
@Service
public class S3StorageService implements StorageService {

    private final S3StorageProperties props;
    private volatile S3Client client;

    public S3StorageService(S3StorageProperties props) {
        this.props = props;
    }

    @Override
    public void upload(String key, InputStream content, long contentLength, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket())
                .key(key)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();
        try {
            client().putObject(request, RequestBody.fromInputStream(content, contentLength));
        } catch (S3Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage upload failed");
        }
    }

    @Override
    public StorageObject download(String key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket())
                .key(key)
                .build();
        try {
            ResponseInputStream<GetObjectResponse> stream = client().getObject(request);
            GetObjectResponse meta = stream.response();
            String contentType = meta.contentType() != null ? meta.contentType() : "application/octet-stream";
            long length = meta.contentLength() != null ? meta.contentLength() : -1L;
            return new StorageObject(stream, length, contentType);
        } catch (NoSuchKeyException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        } catch (S3Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage download failed");
        }
    }

    @Override
    public void delete(String key) {
        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket())
                .key(key)
                .build();
        try {
            client().deleteObject(request);
        } catch (S3Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage delete failed");
        }
    }

    private String bucket() {
        if (props.getBucket() == null || props.getBucket().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Storage is not configured");
        }
        return props.getBucket();
    }

    /** Lazily build the S3 client; tolerate blank config at startup. */
    private S3Client client() {
        S3Client local = client;
        if (local == null) {
            synchronized (this) {
                local = client;
                if (local == null) {
                    local = buildClient();
                    client = local;
                }
            }
        }
        return local;
    }

    private S3Client buildClient() {
        if (props.getEndpoint() == null || props.getEndpoint().isBlank()
                || props.getAccessKey() == null || props.getAccessKey().isBlank()
                || props.getSecretKey() == null || props.getSecretKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Storage is not configured");
        }
        return S3Client.builder()
                .endpointOverride(URI.create(props.getEndpoint()))
                .region(Region.of(props.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey())))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }
}
