package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "address")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Address implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;
    @Column(name = "formal_line")
    private String formalLine;
    @Column(name = "full_name")
    private String fullName;
    @Column(name = "postal_case")
    private String postalCase;
    @Column(name = "address")
    private String address;
    @Column(name = "npa_localite")
    private String npaLocalite;
    @Column(name = "extra_line")
    private String extraLine;

    public Address() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFormalLine() {
        return formalLine;
    }

    public void setFormalLine(String formalLine) {
        this.formalLine = formalLine;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPostalCase() {
        return postalCase;
    }

    public void setPostalCase(String postalCase) {
        this.postalCase = postalCase;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNpaLocalite() {
        return npaLocalite;
    }

    public void setNpaLocalite(String npaLocalite) {
        this.npaLocalite = npaLocalite;
    }

    public String getExtraLine() {
        return extraLine;
    }

    public void setExtraLine(String extraLine) {
        this.extraLine = extraLine;
    }
}
