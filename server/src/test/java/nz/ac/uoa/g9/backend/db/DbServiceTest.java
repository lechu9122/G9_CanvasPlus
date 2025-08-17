package nz.ac.uoa.g9.backend.db;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE;

@JdbcTest
@AutoConfigureTestDatabase(replace = NONE)
// Disable test transactions so there’s no rollback (avoids the prepared statement error)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class DbServiceTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("select 1 returns 1 (basic connectivity)")
    void selectOne_returnsOne() {
        Integer one = jdbcTemplate.queryForObject("select 1", Integer.class);
        assertThat(one).isEqualTo(1);
    }

    @Test
    @DisplayName("now() returns a timestamp string (non-null)")
    void now_returnsNonNull() {
        String now = jdbcTemplate.queryForObject("select now()::text", String.class);
        assertThat(now).isNotNull().isNotBlank();
    }

    @Test
    @DisplayName("parameterized query works")
    void parameterizedQuery_works() {
        int target = 7;
        Integer out = jdbcTemplate.queryForObject("select ?::int", Integer.class, target);
        assertThat(out).isEqualTo(target);
    }
}