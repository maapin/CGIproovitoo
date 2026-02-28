package com.example.proovitoo.repository;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import org.springframework.stereotype.Repository;
import org.yaml.snakeyaml.Yaml;
import java.io.InputStream;

import com.example.proovitoo.model.Table;
import com.example.proovitoo.model.Tags;
import com.example.proovitoo.model.Status;

@Repository
public class TableCollectionRepository {
    private final List<Table> tables = new ArrayList<>();

    public TableCollectionRepository(){
        
        Yaml yaml = new Yaml();
        InputStream inputStream = this.getClass()
        .getClassLoader()
        .getResourceAsStream("tables.yaml");
        List<Table> obj = yaml.load(inputStream);
        //System.out.println(obj);
        //obj.forEach(table -> System.out.println(table.getClass().toString()));
        //System.out.println(yaml.loadAll(inputStream).getClass().toString());
        //tables.addAll(obj);
        //*/
        /*
        tables.add(new Table(1, 4, Status.AVAILABLE, new Tags[]{Tags.NEAR_WINDOW, Tags.CHILD_FRIENDLY}));
        tables.add(new Table(2, 2, Status.AVAILABLE, new Tags[]{Tags.QUIET_AREA}));
        tables.add(new Table(3, 6, Status.RESERVED, new Tags[]{Tags.CHILD_FRIENDLY}));
        tables.add(new Table(4, 4, Status.AVAILABLE, new Tags[]{Tags.OUTDOOR_SEATING}));
        tables.add(new Table(5, 8, Status.RESERVED, new Tags[]{Tags.PRIVATE_ROOM}));
        tables.add(new Table(6, 2, Status.RESERVED, new Tags[]{Tags.OUTDOOR_SEATING})); //*/
    }

    public List<Table> getAllTables() {
        return tables;
    }
    
}
