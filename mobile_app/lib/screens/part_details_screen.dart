import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/part.dart';
import '../providers/parts_provider.dart';

class PartDetailsScreen extends StatefulWidget {
  final Part part;

  const PartDetailsScreen({super.key, required this.part});

  @override
  State<PartDetailsScreen> createState() => _PartDetailsScreenState();
}

class _PartDetailsScreenState extends State<PartDetailsScreen> {
  void _showStockDialog(String type) {
    // type: 'IN' or 'OUT'
    final quantityController = TextEditingController();
    final notesController = TextEditingController();
    final machineController = TextEditingController();
    final isAdding = type == 'IN';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isAdding ? 'Check In Stock' : 'Check Out Stock'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: quantityController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Quantity',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: machineController,
              decoration: const InputDecoration(
                labelText: 'Machine Name (Optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                labelText: 'Notes',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final quantity = int.tryParse(quantityController.text);
              if (quantity == null || quantity <= 0) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a valid quantity')),
                );
                return;
              }

              final success = await Provider.of<PartsProvider>(context, listen: false)
                  .updateStock(widget.part.id, quantity, type, notesController.text, machineController.text);

              if (!mounted) return;

              Navigator.pop(context);
              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Stock ${isAdding ? 'added' : 'removed'} successfully')),
                );
                if (!mounted) return;
                Navigator.pop(context); // Go back to refresh list
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Failed to update stock')),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isAdding ? Colors.green : Colors.red,
            ),
            child: Text(isAdding ? 'Add' : 'Remove'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.part.name),
        backgroundColor: const Color(0xFF7C3AED),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Stock Info
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: widget.part.isLowStock ? Colors.orange[100] : Colors.green[100],
                        borderRadius: BorderRadius.circular(50),
                      ),
                      child: Icon(
                        Icons.inventory_2,
                        size: 40,
                        color: widget.part.isLowStock ? Colors.orange : Colors.green,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${widget.part.quantity}',
                          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                        ),
                        const Text('Available Stock', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                    const Spacer(),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Min: ${widget.part.minQuantity}', 
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                        if (widget.part.isLowStock)
                          Chip(
                            label: const Text('Low Stock', style: TextStyle(color: Colors.white, fontSize: 10)),
                            backgroundColor: Colors.orange,
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Actions
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _showStockDialog('IN'),
                    icon: const Icon(Icons.add),
                    label: const Text('Check In'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _showStockDialog('OUT'),
                    icon: const Icon(Icons.remove),
                    label: const Text('Check Out'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Details
            const Text('Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _buildDetailRow(Icons.category, 'Category', widget.part.category ?? 'N/A'),
            _buildDetailRow(Icons.location_on, 'Location', widget.part.location ?? 'N/A'),
            if (widget.part.description != null)
              _buildDetailRow(Icons.description, 'Description', widget.part.description!),
            
            const SizedBox(height: 24),
            // QR Code Section (Placeholder logic if we had the image)
            if (widget.part.qrCodeUrl != null)
               Center(
                 child: Column(
                   children: [
                     const Text('QR Code', style: TextStyle(fontWeight: FontWeight.bold)),
                     const SizedBox(height: 8),
                     Icon(Icons.qr_code_2, size: 100, color: Colors.grey[400]),
                     // In a real app we would load the image from network
                   ],
                 ),
               ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              Text(value, style: const TextStyle(fontSize: 16)),
            ],
          ),
        ],
      ),
    );
  }
}
