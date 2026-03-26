import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";

import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Specify the data migration function in with-clause


actor {
  // --- COMPONENTS ---

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // --- DATA TYPES ---

  type Signal = {
    user : Principal;
    signalJson : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  // --- PERSISTENT STATE ---

  let signals = List.empty<Signal>();

  // Nested map: Principal -> provider -> apiKey
  let userApiKeys : Map.Map<Principal, Map.Map<Text, Text>> = Map.empty();

  let userProfiles = Map.empty<Principal, UserProfile>();

  // --- USER PROFILE MANAGEMENT ---

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // --- SIGNAL MANAGEMENT ---

  public shared ({ caller }) func saveSignal(signalJson : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save signals");
    };

    let signal : Signal = {
      user = caller;
      signalJson;
    };

    signals.add(signal);
  };

  public query ({ caller }) func getSignalHistory() : async [Text] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access signal history");
    };

    signals.values().toArray().filter(
      func(s) {
        s.user == caller;
      }
    ).map(
      func(s) { s.signalJson }
    );
  };

  // --- API KEY MANAGEMENT (LEGACY) ---

  public shared ({ caller }) func saveApiKey(apiKey : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can manage API keys");
    };

    // Save as "openai" provider for backwards compatibility
    let provider = "openai";

    let userKeys = switch (userApiKeys.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Text>();
        newMap.add(provider, apiKey);
        newMap;
      };
      case (?keys) {
        keys.add(provider, apiKey);
        keys;
      };
    };

    userApiKeys.add(caller, userKeys);
  };

  public query ({ caller }) func getApiKey() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access API keys");
    };

    // Get "openai" provider key (backwards compatibility)
    let provider = "openai";

    switch (userApiKeys.get(caller)) {
      case (null) { Runtime.trap("No API keys found") };
      case (?providers) {
        switch (providers.get(provider)) {
          case (null) { Runtime.trap("API key not found") };
          case (?key) { key };
        };
      };
    };
  };

  // --- API KEY MANAGEMENT (MULTI-PROVIDER) ---

  public shared ({ caller }) func saveProviderApiKey(provider : Text, apiKey : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can manage API keys");
    };

    let userKeys = switch (userApiKeys.get(caller)) {
      case (null) { Map.singleton(provider, apiKey) };
      case (?keys) {
        keys.add(provider, apiKey);
        keys;
      };
    };

    userApiKeys.add(caller, userKeys);
  };

  public query ({ caller }) func getProviderApiKey(provider : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access API keys");
    };

    switch (userApiKeys.get(caller)) {
      case (null) { Runtime.trap("No API keys found") };
      case (?providers) {
        switch (providers.get(provider)) {
          case (null) { Runtime.trap("API key not found") };
          case (?key) { key };
        };
      };
    };
  };

  // --- ANALYZE CHART/AI ---

  public shared ({ caller }) func analyzeChart(symbol : Text, timeframe : Text, marketData : Text, provider : Text, apiKey : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can analyze charts");
    };

    let systemPrompt = "[AI Trading Analysis SYSTEM PROMPT]: You are a professional trading analyst. Analyze the given symbol and timeframe and return ONLY a JSON object with these fields: signal (BUY/SELL/HOLD), confidence (0-100), entryPrice (number), targetPrice (number), stopLoss (number), reasoning (string explaining the analysis in 1-2 sentences and key price levels).";
    let userData = "Analyze this chart: Symbol: " # symbol # ", Timeframe: " # timeframe # " Market data: " # marketData;

    switch (provider) {
      case ("openai") {
        let body = getOpenAIRequestBody(systemPrompt, userData);
        await doOpenAiCall(body, apiKey);
      };
      case ("anthropic") {
        let body = getAnthropicRequestBody(systemPrompt, userData);
        await doAnthropicCall(body, apiKey);
      };
      case ("google") {
        let body = getGoogleGeminiRequestBody(systemPrompt, userData);
        await doGoogleGeminiCall(body, apiKey);
      };
      case ("xai") {
        let body = getXaiRequestBody(systemPrompt, userData);
        await doXaiCall(body, apiKey);
      };
      case ("groq") {
        let body = getGroqRequestBody(systemPrompt, userData);
        await doGroqCall(body, apiKey);
      };
      case (_) {
        Runtime.trap("Unknown provider: " # provider);
      };
    };
  };

  public shared ({ caller }) func chatWithAI(messages : Text, provider : Text, apiKey : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can chat with AI");
    };

    switch (provider) {
      case ("openai") { await doOpenAiCall(messages, apiKey) };
      case ("anthropic") { await doAnthropicCall(messages, apiKey) };
      case ("google") { await doGoogleGeminiCall(messages, apiKey) };
      case ("xai") { await doXaiCall(messages, apiKey) };
      case ("groq") { await doGroqCall(messages, apiKey) };
      case (_) { Runtime.trap("Unknown provider: " # provider) };
    };
  };

  // --- HTTP TRANSFORM CALLBACK ---
  /// Callback function for HTTP transformation required by IC
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // --- PROVIDER SPECIFIC CALLS ---
  func doOpenAiCall(body : Text, apiKey : Text) : async Text {
    let url = "https://api.openai.com/v1/chat/completions";
    let headers = [
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
      {
        name = "Content-Type";
        value = "application/json";
      },
    ];

    await OutCall.httpPostRequest(url, headers, body, transform);
  };

  func doAnthropicCall(body : Text, apiKey : Text) : async Text {
    let url = "https://api.anthropic.com/v1/messages";
    let headers = [
      {
        name = "x-api-key";
        value = apiKey;
      },
      {
        name = "Content-Type";
        value = "application/json";
      },
      {
        name = "anthropic-version";
        value = "2023-06-01";
      },
    ];

    await OutCall.httpPostRequest(url, headers, body, transform);
  };

  func doGoogleGeminiCall(body : Text, apiKey : Text) : async Text {
    let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" # apiKey;
    let headers = [
      {
        name = "Content-Type";
        value = "application/json";
      },
    ];

    await OutCall.httpPostRequest(url, headers, body, transform);
  };

  func doXaiCall(body : Text, apiKey : Text) : async Text {
    let url = "https://api.x.ai/v1/chat/completions";
    let headers = [
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
      {
        name = "Content-Type";
        value = "application/json";
      },
    ];

    await OutCall.httpPostRequest(url, headers, body, transform);
  };

  func doGroqCall(body : Text, apiKey : Text) : async Text {
    let url = "https://api.groq.com/openai/v1/chat/completions";
    let headers = [
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
      {
        name = "Content-Type";
        value = "application/json";
      },
    ];

    await OutCall.httpPostRequest(url, headers, body, transform);
  };

  // --- PROVIDER SPECIFIC REQUEST BODIES ---
  func getOpenAIRequestBody(systemPrompt : Text, userData : Text) : Text {
    "{ \"model\": \"gpt-4o\", \"response_format\": {\"type\": \"json_object\"}, \"temperature\": 0.2, \"messages\": [ { \"role\": \"system\", \"content\": \"" # systemPrompt # "\" }, { \"role\": \"user\", \"content\": \"" # userData # "\" } ] }";
  };

  func getAnthropicRequestBody(systemPrompt : Text, userData : Text) : Text {
    "{ \"model\": \"claude-3-5-sonnet-20241022\", \"max_tokens\": 4096, \"system\": \"" # systemPrompt # "\", \"messages\": [ { \"role\": \"user\", \"content\": \"" # userData # "\" } ] }";
  };

  func getGoogleGeminiRequestBody(systemPrompt : Text, userData : Text) : Text {
    "{ \"system_instruction\": { \"parts\": [ { \"text\": \"" # systemPrompt # "\" } ] }, \"contents\": [{ \"role\": \"user\", \"parts\": [{ \"text\": \"" # userData # "\" }] } ], \"generation_config\": { \"response_mime_type\": \"application/json\" } }";
  };

  func getXaiRequestBody(systemPrompt : Text, userData : Text) : Text {
    "{ \"model\": \"grok-2-latest\", \"response_format\": {\"type\": \"json_object\"}, \"temperature\": 0.2, \"messages\": [ { \"role\": \"system\", \"content\": \"" # systemPrompt # "\" }, { \"role\": \"user\", \"content\": \"" # userData # "\" } ] }";
  };

  func getGroqRequestBody(systemPrompt : Text, userData : Text) : Text {
    "{ \"model\": \"llama-3-1-70b-8192\", \"response_format\": {\"type\": \"json_object\"}, \"temperature\": 0.2, \"messages\": [ { \"role\": \"system\", \"content\": \"" # systemPrompt # "\" }, { \"role\": \"user\", \"content\": \"" # userData # "\" } ] }";
  };
};

