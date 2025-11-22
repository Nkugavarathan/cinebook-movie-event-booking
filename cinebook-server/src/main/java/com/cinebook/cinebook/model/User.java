package com.cinebook.cinebook.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    public enum Role {
        USER,
        ADMIN
    }
    @Enumerated(EnumType.STRING)
    private Role role=Role.USER;
}



//    @ManyToOne
//    @JoinColumn(name = "role_id")
//    private Role role;