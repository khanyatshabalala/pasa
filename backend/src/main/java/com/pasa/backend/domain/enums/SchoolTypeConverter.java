package com.pasa.backend.domain.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Maps the Java SchoolType enum to the lowercase Postgres school_type values.
 * Postgres stores 'public', 'independent', 'private', 'special'.
 * Java enum constants are uppercase (PUBLIC, INDEPENDENT, etc.).
 */
@Converter(autoApply = true)
public class SchoolTypeConverter implements AttributeConverter<SchoolType, String> {

    @Override
    public String convertToDatabaseColumn(SchoolType attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public SchoolType convertToEntityAttribute(String dbData) {
        return SchoolType.fromValue(dbData);
    }
}
