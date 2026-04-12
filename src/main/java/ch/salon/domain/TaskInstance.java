package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "task_instance")
@Data
public class TaskInstance implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", nullable = false)
    private Salon salon;


    @NotNull
    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;


    @Transient
    private LocalDate dueDate;

    @Column(name = "responsible")
    private String responsible;

    @Column(name = "supplier_info", columnDefinition = "text")
    private String supplierInfo;



    @NotNull
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "taskInstance", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<SubtaskInstance> subtasks = new ArrayList<>();

    @OneToMany(mappedBy = "taskInstance", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<TaskComment> comments = new ArrayList<>();
}
