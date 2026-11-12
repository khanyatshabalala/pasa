package com.pasa.backend.domain.enums;

public enum SchoolType {
    PUBLIC("public"),
    INDEPENDENT("independent"),
    PRIVATE("private"),
    SPECIAL("special");

    private final String value;
    SchoolType(String value) { this.value = value; }
    public String getValue() { return value; }

    public static SchoolType fromValue(String v) {
        if (v == null) return null;
        for (SchoolType t : values()) {
            if (t.value.equalsIgnoreCase(v)) return t;
        }
        throw new IllegalArgumentException("Unknown SchoolType: " + v);
    }
}
