package nz.ac.uoa.g9.backend.db;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class DbService {
    private final JdbcTemplate jdbc;

    public DbService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> ping() {
        // Works on Supabase. Returns server time and DB user.
        return jdbc.queryForMap("select now() as server_time, current_user as db_user");
    }
}