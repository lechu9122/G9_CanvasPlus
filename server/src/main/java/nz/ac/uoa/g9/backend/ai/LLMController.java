package nz.ac.uoa.g9.backend.ai;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.openai.client.OpenAIClient;
import com.openai.models.ChatModel;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/ai")
public class LLMController {
  private final OpenAIClient client;

  public LLMController(OpenAIClient client) {
    this.client = client;
  }

  @GetMapping("/ping")
  public ResponseEntity<String> ping() {
    return ResponseEntity.ok("ok");
  }

  @PostMapping(
      value = "/complete",
      consumes = MediaType.TEXT_PLAIN_VALUE,
      produces = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> complete(@RequestBody(required = false) String prompt) {
    String textIn = (prompt == null || prompt.isBlank()) ? "Say this is a test" : prompt;

    ChatCompletionCreateParams params =
        ChatCompletionCreateParams.builder()
            .model(ChatModel.GPT_5_NANO)
            .addUserMessage(textIn)
            .build();

    ChatCompletion chat = client.chat().completions().create(params);
    String out = chat.choices().get(0).message().content().orElse("(no text)");
    return ResponseEntity.ok(out);
  }
}
