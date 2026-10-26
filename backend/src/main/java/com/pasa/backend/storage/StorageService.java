package com.pasa.backend.storage;

import java.io.InputStream;

/**
 * Object storage abstraction. Backed by an S3-compatible endpoint (Supabase storage).
 * Report-card PDFs are streamed through the backend; no browser-facing signed URLs.
 */
public interface StorageService {

    /**
     * Upload (overwrite) an object at the given key.
     */
    void upload(String key, InputStream content, long contentLength, String contentType);

    /**
     * Download the object at the given key.
     */
    StorageObject download(String key);

    /**
     * Delete the object at the given key. No-op if it does not exist.
     */
    void delete(String key);
}
