package nz.ac.uoa.g9.backend.db;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DbController.class)
class DbControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private DbService dbService;

    @Test
    @DisplayName("GET /api/db/ping -> 200 with empty JSON object")
    void ping_returnsEmptyJson() throws Exception {
        mvc.perform(get("/api/db/ping"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(content().json("{}"));
    }
}