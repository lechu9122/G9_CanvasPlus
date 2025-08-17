// src/test/java/nz/ac/uoa/g9/backend/BackendApplicationTests.java
package nz.ac.uoa.g9.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import nz.ac.uoa.g9.backend.db.DbService;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                // keep DB/Flyway out of this test
                "spring.autoconfigure.exclude=" +
                        "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
                        "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
        }
)
class BackendApplicationTests {

    // Prevent any real DB bean graph from being needed
    @MockBean private JdbcTemplate jdbcTemplate;
    @MockBean private DbService dbService;

    @Test
    void contextLoads() { }
}