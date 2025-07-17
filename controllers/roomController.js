const pool = require('../db');

const searchRooms = async (req, res) => {
    try {
        const { check_in, check_out, adults, children = 0, number_of_rooms = 1 } = req.query;

        // Validation
        if (!check_in || !check_out || !adults) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required parameters: check_in, check_out, and adults are required.' 
            });
        }

        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            return res.status(400).json({ success: false, error: 'Invalid date format.' });
        }

        if (checkInDate < today || checkOutDate <= checkInDate) {
            return res.status(400).json({ success: false, error: 'Invalid check-in/check-out range.' });
        }

        const adultsInt = parseInt(adults);
        const childrenInt = parseInt(children);
        const roomsInt = parseInt(number_of_rooms);

        if (isNaN(adultsInt) || isNaN(childrenInt) || isNaN(roomsInt)) {
            return res.status(400).json({ success: false, error: 'Adults, children, and room count must be numbers.' });
        }

        // Call new function from DB
        const result = await pool.query(
            'SELECT * FROM get_available_rooms_full($1, $2, $3, $4, $5)',
            [check_in, check_out, adultsInt, childrenInt, roomsInt]
        );

        // Transform the rooms data to include image_urls array
        const rooms = result.rows.map(row => ({
            ...row.room,
            image_urls: row.room.images.map(img => img.image_url) || ['/default-room.jpg']
        }));

        res.json({
            success: true,
            data: {
                rooms,
                search_parameters: {
                    check_in,
                    check_out,
                    adults: adultsInt,
                    children: childrenInt,
                    rooms: roomsInt,
                    total_guests: adultsInt + childrenInt
                }
            }
        });

    } catch (error) {
        console.error('Error searching rooms:', error);
        res.status(500).json({ success: false, error: 'An unexpected error occurred.' });
    }
};

const searchRoomsCombined = async (req, res) => {
    try {
        const { check_in, check_out, adults, children = 0, number_of_rooms = 1 } = req.query;

        // Validation
        if (!check_in || !check_out || !adults) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required parameters: check_in, check_out, and adults are required.' 
            });
        }

        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            return res.status(400).json({ success: false, error: 'Invalid date format.' });
        }

        if (checkInDate < today || checkOutDate <= checkInDate) {
            return res.status(400).json({ success: false, error: 'Invalid check-in/check-out range.' });
        }

        const adultsInt = parseInt(adults);
        const childrenInt = parseInt(children);
        const roomsInt = parseInt(number_of_rooms);

        if (isNaN(adultsInt) || isNaN(childrenInt) || isNaN(roomsInt)) {
            return res.status(400).json({ success: false, error: 'Adults, children, and room count must be numbers.' });
        }

        if (adultsInt < 0 || childrenInt < 0 || roomsInt < 1) {
            return res.status(400).json({ success: false, error: 'Invalid guest or room count values.' });
        }

        // Call search_rooms_combined function from DB
        const result = await pool.query(
            'SELECT * FROM search_rooms_combined($1, $2, $3, $4, $5)',
            [adultsInt, childrenInt, roomsInt, check_in, check_out]
        );

        const combinations = result.rows.map(row => ({
            combination_room_ids: row.combination_room_ids,
            price_per_night: parseFloat(row.price_per_night),
            total_price: parseFloat(row.total_price),
            capacity: {
                max_adults: row.total_max_adults,
                max_children: row.total_max_children,
                min_occupancy: row.total_min_occupancy,
                max_occupancy: row.total_max_occupancy
            },
            room_details: row.room_details
        }));

        // If no combinations found, try to get alternative single rooms
        let alternativeRooms = [];
        if (combinations.length === 0) {
            try {
                const alternativeResult = await pool.query(
                    'SELECT * FROM get_available_rooms_full($1, $2, $3, $4, 1)',
                    [check_in, check_out, adultsInt, childrenInt]
                );
                alternativeRooms = alternativeResult.rows.map(row => ({
                    ...row.room,
                    image_urls: row.room.images?.map(img => img.image_url) || ['/default-room.jpg']
                }));
            } catch (altError) {
                console.log('No alternative rooms available:', altError.message);
            }
        }

        const responseData = {
            success: true,
            data: {
                combinations,
                rooms: alternativeRooms, // Add alternative rooms
                search_parameters: {
                    check_in,
                    check_out,
                    adults: adultsInt,
                    children: childrenInt,
                    rooms: roomsInt,
                    total_guests: adultsInt + childrenInt,
                    nights: Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
                },
                summary: {
                    total_combinations: combinations.length,
                    price_range: combinations.length > 0 ? {
                        min: Math.min(...combinations.map(c => c.total_price)),
                        max: Math.max(...combinations.map(c => c.total_price))
                    } : null, // Set to null when no combinations
                    alternative_rooms_available: alternativeRooms.length
                }
            }
        };
        
        console.log('searchRoomsCombined response:', JSON.stringify(responseData, null, 2));
        res.json(responseData);

    } catch (error) {
        console.error('Error searching room combinations:', error);
        res.status(500).json({ 
            success: false, 
            error: 'An unexpected error occurred while searching room combinations.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const viewAllRooms = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM view_all_rooms()');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all rooms:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { full_name, email, message } = req.body;
        console.log("Received message:", { full_name, email, message });

        if (!full_name || !email || !message) {
            return res.status(400).json({ error: 'Full name, email, and message are required.' });
        }

        await pool.query(
            'SELECT send_message($1, $2, $3)',
            [full_name, email, message]
        );

        res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
          error: 'Message delivery failed',
          details: error.message
        });
    }
};

const createBooking = async (req, res) => {
    try {
        const {
            email,
            phone,
            checkIn,
            checkOut,
            guests,
            roomId,
            guestList,
            paymentStatus = 'unpaid',
            paymentMethod = null,
            specialRequests = null,
            bookingType = 'single',
            combinationRoomIds = null
        } = req.body;

        // Validation
        if (!email || !phone || !checkIn || !checkOut || !guests || !guestList) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required booking information.' 
            });
        }
        // Add validation before database insertion
        const validateFieldLength = (value, maxLength, fieldName) => {
            if (value && value.length > maxLength) {
                throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
            }
        };

        // Validate field lengths according to database schema
        validateFieldLength(email, 100, 'Email');
        validateFieldLength(phone, 100, 'Phone'); 
        validateFieldLength(phone, 20, 'Phone');
        validateFieldLength(paymentMethod, 100, 'Payment method');
        validateFieldLength(paymentStatus, 50, 'Payment status');

        // Convert guest list to JSON format expected by the database function
        const guestsJson = JSON.stringify(guestList.map(guest => ({
            firstName: guest.firstName,
            lastName: guest.lastName,
            age: parseInt(guest.age),
            isPrimary: guest.isPrimary || false
        })));

        // Add debug prints before database call
        console.log('Creating booking with parameters:', {
            email: email.length > 50 ? email.substring(0, 50) + '...' : email,
            phone: phone.length > 20 ? phone.substring(0, 20) + '...' : phone,
            paymentStatus,
            paymentMethod,
            specialRequests,
            guestList,
            guests,
        });
        // Additional debug logging
        console.log('Serialized guestList for DB:', guestsJson);

        const result = await pool.query(
            'SELECT create_booking($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [
                email,
                phone,
                checkIn,
                checkOut,
                parseInt(guests),
                combinationRoomIds ? combinationRoomIds[0] : parseInt(roomId),
                guestsJson,
                paymentStatus,
                paymentMethod,
                specialRequests,
                !!combinationRoomIds,
                combinationRoomIds ? combinationRoomIds : null
            ]
        );

        // Debug log for SQL result
        console.log('SQL create_booking result:', result.rows);
        const bookingResult = result.rows[0].create_booking;
        let bookingNumber = null;
        if (bookingResult.booking_number) {
            bookingNumber = bookingResult.booking_number;
            res.json({
                booking_number: bookingNumber
            });
        } else {
            console.error('Booking creation failed, no booking_number in result:', bookingResult);
            res.status(500).json({
                success: false,
                error: 'Booking creation failed. No booking number returned.'
            });
        }

        // Removed duplicate res.json here

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create booking',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getCombinationDetails = async (req, res) => {
    try {
        const { combinationId } = req.params;

        if (!combinationId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Combination ID is required' 
            });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(combinationId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid combination ID format' 
            });
        }

        const result = await pool.query(
            'SELECT * FROM get_combination_details($1)',
            [combinationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'No combination found with this ID' 
            });
        }

        const data = result.rows[0];
        
        res.json({
            success: true,
            data: {
                combination: data.combination_info,
                rooms: data.rooms_info || [],
                guests: data.guests_info || []
            }
        });

    } catch (error) {
        console.error('Error fetching combination details:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch combination details' 
        });
    }
};

// Function to get all combinations (for hotel management)
const getAllCombinations = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                combination_name,
                total_rooms,
                total_guests,
                total_price,
                check_in,
                check_out,
                email,
                payment_status,
                created_at
            FROM combinations 
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching combinations:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch combinations' 
        });
    }
};

const getCombinationBooking = async (req, res) => {
    try {
        const { combinationId } = req.params;

        if (!combinationId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Combination ID is required' 
            });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(combinationId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid combination ID format' 
            });
        }

        const result = await pool.query(
            'SELECT * FROM get_combination_booking_details($1)',
            [combinationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'No combination booking found with this ID' 
            });
        }

        // Group the data for better presentation
        const bookingData = {
            combination_id: combinationId,
            booking_info: {
                email: result.rows[0].email,
                phone: result.rows[0].phone,
                check_in: result.rows[0].check_in,
                check_out: result.rows[0].check_out,
                payment_status: result.rows[0].payment_status,
                payment_method: result.rows[0].payment_method,
                special_requests: result.rows[0].special_requests,
                created_at: result.rows[0].created_at
            },
            rooms: result.rows.map(row => ({
                booking_id: row.booking_id,
                booking_number: row.booking_number,
                room_id: row.room_id,
                room_name: row.room_name,
                room_description: row.room_description,
                room_price: row.room_price,
                guests: row.guests,
                room_images: row.room_images || [],
                guest_details: row.guest_details || []
            })),
            total_rooms: result.rows.length,
            total_guests: result.rows.reduce((sum, row) => sum + row.guests, 0)
        };

        res.json({
            success: true,
            data: bookingData
        });

    } catch (error) {
        console.error('Error fetching combination booking:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch combination booking details' 
        });
    }
};

const getDynamicPrice = async (req, res) => {
    try {
        const { roomId, checkIn } = req.query;

        if (!roomId || !checkIn) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required parameters: roomId and checkIn are required.' 
            });
        }

        const result = await pool.query(
            'SELECT get_dynamic_price($1, $2)',
            [parseInt(roomId), checkIn]
        );

        const price = result.rows[0].get_dynamic_price;

        res.json({
            success: true,
            data: {
                price: parseFloat(price)
            }
        });
    } catch (error) {
        console.error('Error fetching dynamic price:', error);
        res.status(500).json({ success: false, error: 'An unexpected error occurred.' });
    }
};

const adminViewAllReservations = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM admin_view_all_reservations()');
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching all reservations:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch reservations',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const adminViewAllMessages = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM admin_view_all_messages()');
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching all messages:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch messages',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    searchRooms,
    viewAllRooms,
    sendMessage,
    searchRoomsCombined,
    createBooking,
    getCombinationDetails,  // Add this
    getAllCombinations,
    getDynamicPrice,
    adminViewAllReservations,
    adminViewAllMessages  // Add this export
};


const handleBookingAndPayment = async (req, res) => {
  try {
    // 1. First create booking with status 'pending'
    const bookingResult = await createBooking(req.body);
    
    if (!bookingResult.success) {
      return res.status(400).json(bookingResult);
    }

    // 2. Only if booking succeeded, process payment
    const paymentResult = await processPayment(req.body);
    
    if (paymentResult.success) {
      // 3. Update booking status to 'paid'
      await updateBookingStatus(bookingResult.data.bookingId, 'paid');
      return res.json(paymentResult);
    } else {
      // 4. Mark booking as 'payment failed'
      await updateBookingStatus(bookingResult.data.bookingId, 'payment failed');
      return res.status(400).json(paymentResult);
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
