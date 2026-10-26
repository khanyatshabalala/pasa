package com.pasa.backend.domain.entity;

import com.pasa.backend.domain.enums.SchoolPhase;
import com.pasa.backend.domain.enums.SchoolType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "schools", schema = "public")
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "emis_number", unique = true, nullable = false)
    private String emisNumber;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    private String province;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SchoolPhase phase;

    @Enumerated(EnumType.STRING)
    @Column(name = "school_type", nullable = false)
    private SchoolType schoolType;

    private String address;
    private String city;

    @Column(name = "postal_code")
    private String postalCode;

    private String phone;
    private String email;
    private String website;

    @Column(name = "principal_name")
    private String principalName;

    @Column(name = "established_year")
    private Integer establishedYear;

    @Column(name = "learner_count")
    private Integer learnerCount;

    @Column(name = "fees_annual", precision = 10, scale = 2)
    private BigDecimal feesAnnual;

    @Column(name = "logo_url")
    private String logoUrl;

    private String motto;
    private String description;

    @Column(name = "district_id")
    private UUID districtId;

    // ── Admissions (informational) ───────────────────────────────────────
    @Column(name = "grade_from")
    private Integer gradeFrom;

    @Column(name = "grade_to")
    private Integer gradeTo;

    @Column(name = "application_open")
    private LocalDate applicationOpen;

    @Column(name = "application_close")
    private LocalDate applicationClose;

    @Column(name = "admission_requirements")
    private String admissionRequirements;

    @Column(name = "application_contact")
    private String applicationContact;

    // ── Performance (read-only; maintained by recalculate_school_performance) ─
    @Column(name = "performance_avg", precision = 5, scale = 2, insertable = false, updatable = false)
    private BigDecimal performanceAvg;

    @Column(name = "performance_rank_district", insertable = false, updatable = false)
    private Integer performanceRankDistrict;

    @Column(name = "performance_rank_province", insertable = false, updatable = false)
    private Integer performanceRankProvince;

    @Column(name = "performance_rank_national", insertable = false, updatable = false)
    private Integer performanceRankNational;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public School() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmisNumber() { return emisNumber; }
    public void setEmisNumber(String emisNumber) { this.emisNumber = emisNumber; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public SchoolPhase getPhase() { return phase; }
    public void setPhase(SchoolPhase phase) { this.phase = phase; }
    public SchoolType getSchoolType() { return schoolType; }
    public void setSchoolType(SchoolType schoolType) { this.schoolType = schoolType; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getPrincipalName() { return principalName; }
    public void setPrincipalName(String principalName) { this.principalName = principalName; }
    public Integer getEstablishedYear() { return establishedYear; }
    public void setEstablishedYear(Integer establishedYear) { this.establishedYear = establishedYear; }
    public Integer getLearnerCount() { return learnerCount; }
    public void setLearnerCount(Integer learnerCount) { this.learnerCount = learnerCount; }
    public BigDecimal getFeesAnnual() { return feesAnnual; }
    public void setFeesAnnual(BigDecimal feesAnnual) { this.feesAnnual = feesAnnual; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getMotto() { return motto; }
    public void setMotto(String motto) { this.motto = motto; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public UUID getDistrictId() { return districtId; }
    public void setDistrictId(UUID districtId) { this.districtId = districtId; }
    public Integer getGradeFrom() { return gradeFrom; }
    public void setGradeFrom(Integer gradeFrom) { this.gradeFrom = gradeFrom; }
    public Integer getGradeTo() { return gradeTo; }
    public void setGradeTo(Integer gradeTo) { this.gradeTo = gradeTo; }
    public LocalDate getApplicationOpen() { return applicationOpen; }
    public void setApplicationOpen(LocalDate applicationOpen) { this.applicationOpen = applicationOpen; }
    public LocalDate getApplicationClose() { return applicationClose; }
    public void setApplicationClose(LocalDate applicationClose) { this.applicationClose = applicationClose; }
    public String getAdmissionRequirements() { return admissionRequirements; }
    public void setAdmissionRequirements(String admissionRequirements) { this.admissionRequirements = admissionRequirements; }
    public String getApplicationContact() { return applicationContact; }
    public void setApplicationContact(String applicationContact) { this.applicationContact = applicationContact; }
    public BigDecimal getPerformanceAvg() { return performanceAvg; }
    public void setPerformanceAvg(BigDecimal performanceAvg) { this.performanceAvg = performanceAvg; }
    public Integer getPerformanceRankDistrict() { return performanceRankDistrict; }
    public void setPerformanceRankDistrict(Integer performanceRankDistrict) { this.performanceRankDistrict = performanceRankDistrict; }
    public Integer getPerformanceRankProvince() { return performanceRankProvince; }
    public void setPerformanceRankProvince(Integer performanceRankProvince) { this.performanceRankProvince = performanceRankProvince; }
    public Integer getPerformanceRankNational() { return performanceRankNational; }
    public void setPerformanceRankNational(Integer performanceRankNational) { this.performanceRankNational = performanceRankNational; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
