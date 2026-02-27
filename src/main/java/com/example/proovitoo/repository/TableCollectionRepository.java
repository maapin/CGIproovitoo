package com.example.proovitoo.repository;

import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Repository;
import com.example.proovitoo.model.Table;
import com.example.proovitoo.model.Tags;
import com.example.proovitoo.model.Status;

@Repository
public class TableCollectionRepository {
    private final List<Table> tables = new ArrayList<>();

    public TableCollectionRepository(){
        tables.add(new Table(1, 4, Status.AVAILABLE, Tags.NEAR_WINDOW));
        tables.add(new Table(2, 2, Status.AVAILABLE, Tags.QUIET_AREA));
        tables.add(new Table(3, 6, Status.RESERVED, Tags.CHILD_FRIENDLY));
        tables.add(new Table(4, 4, Status.AVAILABLE, Tags.OUTDOOR_SEATING));
        tables.add(new Table(5, 8, Status.RESERVED, Tags.PRIVATE_ROOM));
        tables.add(new Table(6, 2, Status.RESERVED, Tags.OUTDOOR_SEATING));
    }

    public List<Table> getAllTables() {
        return tables;
    }
    
}
