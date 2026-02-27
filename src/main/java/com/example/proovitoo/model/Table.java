package com.example.proovitoo.model;

public record Table(
    Integer id,
    Integer seats,
    Status status,
    Tags tags
) {
}
