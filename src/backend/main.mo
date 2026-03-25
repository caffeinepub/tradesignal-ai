import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";

import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // --- COMPONENTS ---

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // --- DATA TYPES ---

  type Signal = {
    user : Principal;
    signalJson : Text;
  };

  // --- PERSISTENT STATE ---

  let signals = List.empty<Signal>();
  let userApiKeys = Map.empty<Principal, Text>();

  // --- SIGNAL MANAGEMENT ---

  public shared ({ caller }) func saveSignal(signalJson : Text) : async () {
    // Only allow logged in users
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("You must be logged in to save signals");
    };

    let signal : Signal = {
      user = caller;
      signalJson;
    };

    signals.add(signal);
  };

  public query ({ caller }) func getSignalHistory() : async [Text] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("You must be logged in");
    };

    signals.values().toArray().filter(
      func(s) {
        s.user == caller;
      }
    ).map(
      func(s) { s.signalJson }
    );
  };

  // --- API KEY MANAGEMENT ---

  public shared ({ caller }) func saveApiKey(apiKey : Text) : async () {
    // Authenticated users only
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("You must be logged in");
    };

    userApiKeys.add(caller, apiKey);
  };

  public query ({ caller }) func getApiKey() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("You must be logged in to access your API key");
    };

    switch (userApiKeys.get(caller)) {
      case (null) { Runtime.trap("API key not found") };
      case (?key) { key };
    };
  };

  // --- AI ANALYSIS ---

  public shared ({ caller }) func analyzeChart(symbol : Text, timeframe : Text, marketData : Text, apiKey : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can analyze charts");
    };

    let systemPrompt = "You are a professional trading advisor. Analyze the following data and return one JSON result with analysis, trading signal ('long', 'short', 'neutral', 'indeterminate'), confidence (0-100), risk level (0-100), entry price, target price, stop loss level, and rationale. Answer only in this JSON format. No explanation.";
    let userData = "Analyze this chart: Symbol: " # symbol # ", Timeframe: " # timeframe # " Market data: " # marketData;

    let body = getBody(systemPrompt, userData);

    await doOpenAiCall(body, apiKey);
  };

  public shared ({ caller }) func chatWithAI(messages : Text, apiKey : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can chat with AI");
    };

    await doOpenAiCall(messages, apiKey);
  };

  /// Callback function for HTTP transformation required by IC
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

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

  func getBody(systemPrompt : Text, userData : Text) : Text {
    "{ \"model\": \"gpt-3.5-turbo-0125\", \"response_format\": {\"type\": \"json_object\"}, \"temperature\": 0.2, \"messages\": [ { \"role\": \"system\", \"content\": \"" # systemPrompt # "\" }, { \"role\": \"user\", \"content\": \"" # userData # "\" } ] }";
  };
};
