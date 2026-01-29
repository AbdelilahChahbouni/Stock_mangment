import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  // Use 10.0.2.2 for Android Emulator to access localhost
  // Use actual IP for physical device
  //static const String baseUrl = 'https://stock.madrassatech.com/api';
  static const String baseUrl = 'http://localhost:5000/api';
  final storage = const FlutterSecureStorage();

  Future<String?> getToken() async {
    return await storage.read(key: 'jwt_token');
  }

  Future<Map<String, String>> getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token != null ? 'Bearer $token' : '',
    };
  }

  Future<dynamic> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await storage.write(key: 'jwt_token', value: data['access_token']);
      await storage.write(key: 'username', value: username);
      await storage.write(key: 'role', value: data['role'] ?? 'technician');
      return data['user'];
    } else {
      throw Exception('Failed to login: ${response.body}');
    }
  }

  Future<dynamic> signup(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await storage.write(key: 'jwt_token', value: data['access_token']);
      await storage.write(key: 'username', value: username);
      await storage.write(key: 'role', value: 'technician');
      return data['user'];
    } else {
      throw Exception('Failed to register: ${response.body}');
    }
  }

  Future<void> logout() async {
    await storage.deleteAll();
  }
}
