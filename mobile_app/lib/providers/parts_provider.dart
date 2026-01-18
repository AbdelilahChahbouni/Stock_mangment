import 'package:flutter/material.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../models/part.dart';
import 'package:http/http.dart' as http;

class PartsProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Part> _parts = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Part> get parts => _parts;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<Part> get lowStockParts => _parts.where((p) => p.isLowStock).toList();

  Future<void> fetchParts() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final headers = await _apiService.getHeaders();
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/parts'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        final List<dynamic> data = responseData['parts'];
        _parts = data.map((json) => Part.fromJson(json)).toList();
      } else {
        _errorMessage = 'Failed to load parts: ${response.statusCode}';
      }
    } catch (e) {
      _errorMessage = 'Error loading parts: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Part?> fetchPartById(int id) async {
    try {
      final headers = await _apiService.getHeaders();
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/parts/$id'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        return Part.fromJson(responseData['part']);
      }
    } catch (e) {
      print('Error fetching part $id: $e');
    }
    return null;
  }

  Future<bool> updateStock(int partId, int quantity, String type, String notes, String machine) async {
    // type should be 'IN' or 'OUT'
    try {
      final headers = await _apiService.getHeaders();
      final endpoint = type == 'IN' ? '/transactions/in' : '/transactions/out';
      
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}$endpoint'),
        headers: headers,
        body: jsonEncode({
          'part_id': partId,
          'quantity': quantity,
          'notes': notes,
          'machine': machine,
        }),
      );

      if (response.statusCode == 201) {
        // Refresh parts to show new stock level
        await fetchParts();
        return true;
      }
      return false;
    } catch (e) {
      print('Error updating stock: $e');
      return false;
    }
  }
}
