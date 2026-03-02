package com.example.proovitoo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    // loen küll ajatempli, aga kuna andmed on alati juhuslikult genereeritud,
    // siis trükin selle ainult välja.
    @GetMapping("")
    public List<Table> getAllTables(@RequestParam(required = false, value = "t") String t) {
        System.out.println("Requested timestamp: " + t);
        return tableCollectionRepository.getAllTables();
    }
}
