class Part {
  final int id;
  final String name;
  final String? description;
  final int quantity;
  final int minQuantity;
  final String? location;
  final String? category;
  final String? imageUrl;
  final String? qrCodeUrl;
  final bool isLowStock;

  Part({
    required this.id,
    required this.name,
    this.description,
    required this.quantity,
    required this.minQuantity,
    this.location,
    this.category,
    this.imageUrl,
    this.qrCodeUrl,
    required this.isLowStock,
  });

  factory Part.fromJson(Map<String, dynamic> json) {
    return Part(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      quantity: json['quantity'],
      minQuantity: json['min_quantity'],
      location: json['location'],
      category: json['category'],
      imageUrl: json['image_url'],
      qrCodeUrl: json['qr_code_url'],
      isLowStock: json['is_low_stock'] ?? false,
    );
  }
}
