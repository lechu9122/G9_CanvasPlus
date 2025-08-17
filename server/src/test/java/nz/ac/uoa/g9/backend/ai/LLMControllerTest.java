package nz.ac.uoa.g9.backend.ai;

import com.openai.client.OpenAIClient;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mockito.Answers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = LLMController.class)
class LLMControllerTest {

    @Autowired
    private MockMvc mvc;

    // We need deep stubs because the controller calls client.responses().create(...)
    @MockBean(answer = Answers.RETURNS_DEEP_STUBS)
    private OpenAIClient openAIClient;

    @Test
    @DisplayName("GET /api/ai/ping returns 200 OK with 'ok'")
    void ping_returnsOk() throws Exception {
        mvc.perform(get("/api/ai/ping"))
                .andExpect(status().isOk())
                .andExpect(content().string("ok"))
                .andExpect(content().contentType("text/plain;charset=UTF-8"));
    }

    @Test
    @DisplayName("POST /api/ai/complete returns mocked OpenAI text")
    void complete_returnsMockedText() throws Exception {
        // Mock the Response the SDK would return (deep stubs so any nested getters return mocks)
        Response fake = Mockito.mock(Response.class, org.mockito.Answers.RETURNS_DEEP_STUBS);


        // Stub the nested call: client.responses().create(params) -> fake
        when(openAIClient
                .responses()
                .create(any(ResponseCreateParams.class)))
                .thenReturn(fake);

        mvc.perform(
                post("/api/ai/complete")
                        // Controller expects a request param, not JSON
                        .param("prompt", "Say hello")
        )
        .andExpect(status().isOk());
    }
}