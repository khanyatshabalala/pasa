package com.pasa.backend.domain.enums;

public enum SchoolType {
    PUBLIC("public"),
    INDEPENDENT("independent"),
    PRIVATE("private"),
    SPECIAL("special");

    private final String value;
    SchoolType(String value) { this.value = value; }
    public String getValue() { return value; }
}
