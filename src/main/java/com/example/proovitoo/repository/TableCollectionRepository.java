package com.example.proovitoo.repository;

import java.util.List;
import java.io.InputStream;
import java.util.ArrayList;

import org.springframework.asm.TypeReference;
import org.springframework.stereotype.Repository;
import com.example.proovitoo.model.Table;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.dataformat.yaml.YAMLFactory;

import com.example.proovitoo.model.Status;

@Repository
public class TableCollectionRepository {
    private final List<Table> tables = new ArrayList<>();
    private final ObjectMapper objectMapper;

    public TableCollectionRepository() {

        this.objectMapper = new ObjectMapper(new YAMLFactory());

        try {
            InputStream yamlInputStream = TypeReference.class.getResourceAsStream("/tables.yaml");
            Table[] loadedTables = this.objectMapper.readValue(yamlInputStream, Table[].class);
            for (Table table : loadedTables) {
                int random = (int) (Math.random() * 101);
                if (random <= 30) {
                    tables.add(table.setStatus(Status.RESERVED));
                } else {
                    tables.add(table.setStatus(Status.AVAILABLE));
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading tables.yaml: " + e.getMessage());
        }

    }

    public List<Table> getAllTables() {
        return tables;
    }

}
