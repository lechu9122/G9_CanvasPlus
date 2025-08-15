package example;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.LowLevelHttpRequest;
import com.google.api.client.http.LowLevelHttpResponse;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.testing.http.MockHttpTransport;
import com.google.api.client.testing.http.MockLowLevelHttpRequest;
import com.google.api.client.testing.http.MockLowLevelHttpResponse;
import com.google.api.client.util.DateTime;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.CalendarList;
import com.google.api.services.calendar.model.Events;

import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

public class CliCalendarApp {
    private static final JsonFactory JSON = GsonFactory.getDefaultInstance();
    private static final Path TOKENS_DIR = Paths.get("tokens");

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            printUsage();
            return;
        }
        // Real Vs Mock Initialisation
        boolean mock = hasFlag(args, "--mock");
        Calendar service = mock ? buildMockService() : buildRealService();

        switch (args[0]) {
            case "calendars" -> listCalendars(service);
            case "events" -> {
                String calendarId = getArgValue(args, "--calendarId", "primary");
                int days = Integer.parseInt(getArgValue(args, "--days", "7"));
                listEvents(service, calendarId, days);
            }
            default -> printUsage();
        }
    }
    // Shows user the menu when no input is recieved upon execution
    private static void printUsage() {
        System.out.println("""
        Hi, When testing, please use the Mock command, PM on discord for further issues
        Usage:
            Note: Calendars will display the number of calendars the user has and the names
            the scope of this project should only use events.
            java -jar app.jar calendars [--mock]
            java -jar app.jar events --calendarId <id> [--days N] [--mock]

        """);
    }

    // ---------- Live (real) API ----------
    private static Calendar buildRealService() throws Exception {
        var http = GoogleNetHttpTransport.newTrustedTransport();
        Credential cred = authorize(http);
        return new Calendar.Builder(http, JSON, cred)
                .setApplicationName("calendar-cli")
                .build();
    }

    private static Credential authorize(com.google.api.client.http.HttpTransport http) throws Exception {
        try (var in = CliCalendarApp.class.getResourceAsStream("/credentials.json")) {
            if (in == null) throw new IllegalStateException("Place credentials.json in src/main/resources/");
            GoogleClientSecrets secrets = GoogleClientSecrets.load(JSON, new InputStreamReader(in));
            GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                    http, JSON, secrets, List.of(CalendarScopes.CALENDAR_READONLY))
                    .setAccessType("offline")
                    .setDataStoreFactory(new FileDataStoreFactory(TOKENS_DIR.toFile()))
                    .build();
            // this opens the browser to intiate Oauth
            return new AuthorizationCodeInstalledApp(flow, new LocalServerReceiver.Builder()
                    .setPort(8888).build())
                    .authorize("user");
        }
    }

    // ---------- Mock (no network, fake responses) ----------
    private static Calendar buildMockService() throws GeneralSecurityException {
        MockHttpTransport transport = new MockHttpTransport() {
            @Override
            public LowLevelHttpRequest buildRequest(String method, String url) {
                // Return fake JSON depending on the endpoint
                return new MockLowLevelHttpRequest(url) {
                    @Override
                    public LowLevelHttpResponse execute() {
                        String json = route(url, method);
                        return new MockLowLevelHttpResponse()
                                .setStatusCode(200)
                                .setContentType("application/json")
                                .setContent(json);
                    }
                };
            }

            private String route(String url, String method) {
                if ("GET".equals(method) && url.contains("/users/me/calendarList")) {
                    return """
              {
                "kind": "calendar#calendarList",
                "items": [
                  { "id": "primary", "summary": "Primary" },
                  { "id": "team@example.com", "summary": "Team Calendar" }
                ]
              }
              """;
                }
                if ("GET".equals(method) && url.contains("/calendars/") && url.contains("/events")) {
                    return """
              {
                "kind": "calendar#events",
                "items": [
                  {
                    "id": "evt1",
                    "summary": "Daily standup",
                    "start": { "dateTime": "2025-08-16T22:00:00Z" },
                    "end":   { "dateTime": "2025-08-16T22:15:00Z" }
                  },
                  {
                    "id": "evt2",
                    "summary": "Company Holiday",
                    "start": { "date": "2025-08-17" },
                    "end":   { "date": "2025-08-18" }
                  }
                ],
                "nextPageToken": null
              }
              """;
                }
                // Default fallback
                return "{ \"kind\": \"calendar#unknown\", \"url\": \"" + url + "\" }";
            }
        };

        return new Calendar.Builder(transport,
                GsonFactory.getDefaultInstance(),
                request -> {}) // no credentials needed in mock mode
                .setApplicationName("calendar-cli-mock")
                .build();
    }

    // ---------- Commands ----------
    private static void listCalendars(Calendar service) throws Exception {
        CalendarList list = service.calendarList().list().setFields("items(id,summary)").execute();
        System.out.println(pretty(list));
    }
    // Note the cli defaults to 7 days of events, this can change
    private static void listEvents(Calendar service, String calendarId, int days) throws Exception {
        DateTime timeMin = new DateTime(Instant.now().toEpochMilli());
        DateTime timeMax = new DateTime(Instant.now().plus(days, ChronoUnit.DAYS).toEpochMilli());

        Events events = service.events().list(calendarId)
                .setTimeMin(timeMin)
                .setTimeMax(timeMax)
                .setSingleEvents(true) //this means recurring events is only returned as a single event
                .setOrderBy("startTime")
                .setFields("items(id,summary,start,end),nextPageToken") // NOTE: there is a max events count of 250 , which is where the nextPageToken comes in, but no one has more than 250 calendar events right? :clueless:
                .execute();

        System.out.println(pretty(events));
// enable if you want the CLI to output symmary text, this is done by cahtgpt
//        System.out.println("\nSummary | Start -> End");
//        events.getItems().forEach(e -> {
//            String start = e.getStart() != null
//                    ? (e.getStart().getDateTime() != null
//                    ? e.getStart().getDateTime().toStringRfc3339()
//                    : e.getStart().getDate().toStringRfc3339())
//                    : "?";
//            String end = e.getEnd() != null
//                    ? (e.getEnd().getDateTime() != null
//                    ? e.getEnd().getDateTime().toStringRfc3339()
//                    : e.getEnd().getDate().toStringRfc3339())
//                    : "?";
//            System.out.println((e.getSummary() == null ? "(no title)" : e.getSummary()) + " | " + start + " -> " + end);
//        });
    }
// helpers, change this and I might commit crimes
    private static boolean hasFlag(String[] args, String flag) {
        for (String a : args) if (a.equalsIgnoreCase(flag)) return true;
        return false;
    }
    private static String getArgValue(String[] args, String key, String def) {
        for (int i = 0; i < args.length; i++) if (args[i].equalsIgnoreCase(key) && i + 1 < args.length) return args[i+1];
        return def;
    }

    // uses google's own prettyString to format the json
    private static String pretty(Object o) {
        try {
            return JSON.toPrettyString(o);
        } catch (Exception e) {
            return String.valueOf(o);
        }
    }
}
