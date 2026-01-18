import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../providers/parts_provider.dart';
import 'part_details_screen.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  bool _isProcessing = false;
  final TextEditingController _manualController = TextEditingController();

  void _handleBarcode(BarcodeCapture capture) async {
    if (_isProcessing) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? code = barcodes.first.rawValue;
    if (code == null) return;
    
    _processCode(code);
  }

  void _processCode(String code) async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      int? partId;
      if (int.tryParse(code) != null) {
        partId = int.parse(code);
      } else {
        final uri = Uri.tryParse(code);
        if (uri != null && uri.pathSegments.isNotEmpty) {
           final lastSegment = uri.pathSegments.last;
           partId = int.tryParse(lastSegment);
        }
      }

      if (partId != null) {
        final provider = Provider.of<PartsProvider>(context, listen: false);
        final part = await provider.fetchPartById(partId);

        if (!mounted) return;

        if (part != null) {
           Navigator.pushReplacement(
            context,
            MaterialPageRoute(
               builder: (context) => PartDetailsScreen(part: part),
            ),
          );
          return;
        } else {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text('Part not found')),
           );
        }
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid QR Code format')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Check if running on desktop (Linux, Windows, macOS)
    bool isDesktop = !kIsWeb && (Platform.isLinux || Platform.isWindows || Platform.isMacOS);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: const Color(0xFF7C3AED),
      ),
      body: isDesktop ? _buildDesktopFallback() : MobileScanner(
        onDetect: _handleBarcode,
      ),
    );
  }

  Widget _buildDesktopFallback() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.monitor, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'Scanner not available on Desktop',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Enter Part ID or QR content manually to test:',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _manualController,
              decoration: const InputDecoration(
                labelText: 'QR Content (e.g. 12)',
                border: OutlineInputBorder(),
              ),
              onSubmitted: (value) => _processCode(value),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _processCode(_manualController.text),
              child: const Text('Simulate Scan'),
            ),
          ],
        ),
      ),
    );
  }
}
