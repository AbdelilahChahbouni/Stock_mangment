import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/parts_provider.dart';
import '../models/part.dart';
import 'part_details_screen.dart';
import 'scanner_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => 
      Provider.of<PartsProvider>(context, listen: false).fetchParts()
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).userData;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: const Color(0xFF7C3AED),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => Provider.of<PartsProvider>(context, listen: false).fetchParts(),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => Provider.of<AuthProvider>(context, listen: false).logout(),
          ),
        ],
      ),
      body: Consumer<PartsProvider>(
        builder: (context, partsProvider, child) {
          if (partsProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (partsProvider.errorMessage != null) {
            return Center(child: Text(partsProvider.errorMessage!));
          }

          final parts = partsProvider.parts;
          final lowStock = partsProvider.lowStockParts;

          return RefreshIndicator(
            onRefresh: () => partsProvider.fetchParts(),
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                Text(
                  'Welcome, ${user?['username'] ?? 'User'}!',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                
                // Summary Cards
                Row(
                  children: [
                    Expanded(
                      child: _buildSummaryCard(
                        'Total Parts',
                        parts.length.toString(),
                        Icons.inventory_2,
                        Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildSummaryCard(
                        'Low Stock',
                        lowStock.length.toString(),
                        Icons.warning,
                        Colors.orange,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                const Text(
                  'Inventory List',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                
                ...parts.map((part) => _buildPartTile(part)).toList(),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const ScannerScreen()),
          ).then((_) {
             if (!mounted) return;
             Provider.of<PartsProvider>(context, listen: false).fetchParts();
          });
        },
        backgroundColor: const Color(0xFF7C3AED),
        child: const Icon(Icons.qr_code_scanner),
      ),
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Text(
              title,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPartTile(Part part) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: part.isLowStock ? Colors.orange[100] : Colors.green[100],
          child: Icon(
            Icons.build,
            color: part.isLowStock ? Colors.orange : Colors.green,
          ),
        ),
        title: Text(part.name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('Qty: ${part.quantity} | Min: ${part.minQuantity}'),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => PartDetailsScreen(part: part),
            ),
          ).then((_) {
            // Refresh list when returning
            if (!mounted) return;
            Provider.of<PartsProvider>(context, listen: false).fetchParts();
          });
        },
      ),
    );
  }
}
