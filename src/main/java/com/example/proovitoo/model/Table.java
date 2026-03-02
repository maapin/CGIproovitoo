package com.example.proovitoo.model;

public record Table(
        Integer id,
        Integer seats,
        Status status,
        Tags[] tags) {
    public Table setStatus(Status newStatus) {
        return new Table(this.id, this.seats, newStatus, this.tags);
    }
}
