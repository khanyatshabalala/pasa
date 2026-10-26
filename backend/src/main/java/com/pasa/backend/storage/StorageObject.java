package com.pasa.backend.storage;

import java.io.InputStream;

/**
 * A downloaded storage object: its content stream, length in bytes, and content type.
 */
public record StorageObject(InputStream content, long contentLength, String contentType) {}
