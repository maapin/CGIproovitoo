package com.example.proovitoo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.proovitoo.model.Table;
import com.example.proovitoo.repository.TableCollectionRepository;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableCollectionRepository tableCollectionRepository;
    
    public TableController(TableCollectionRepository tableCollectionRepository) {
        this.tableCollectionRepository = tableCollectionRepository;
    }

    @GetMapping("")
    public List<Table> getAllTables() {
        return tableCollectionRepository.getAllTables();
    }
}
