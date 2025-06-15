// DOM Elements
const borrowForm = document.getElementById('borrowForm');
const returnModal = document.getElementById('returnModal');
const bookSearch = document.getElementById('bookSearch');
const bookSelect = document.getElementById('bookSelect');
const readerSearch = document.getElementById('readerSearch');
const readerSelect = document.getElementById('readerSelect');
const borrowedBooksTableBody = document.getElementById('borrowedBooksTableBody');

// Current borrowing being returned
let currentReturnBorrowing = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadBorrowedBooks();
    initializeSelects();
    setMinDueDate();
});

// Setup event listeners
function setupEventListeners() {
    borrowForm.addEventListener('submit', handleBorrowSubmit);
    bookSearch.addEventListener('input', handleBookSearch);
    readerSearch.addEventListener('input', handleReaderSearch);
}

// Set minimum due date to today
function setMinDueDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dueDate').min = today;
}

// Initialize book and reader select options
function initializeSelects() {
    // Load available books
    const books = dataStore.getBooks().filter(book => book.status === 'available');
    bookSelect.innerHTML = '<option value="">Select a book</option>';
    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book.id;
        option.textContent = `${book.title} (${book.category})`;
        bookSelect.appendChild(option);
    });

    // Load readers
    const readers = dataStore.getReaders();
    readerSelect.innerHTML = '<option value="">Select a reader</option>';
    readers.forEach(reader => {
        const option = document.createElement('option');
        option.value = reader.id;
        option.textContent = `${reader.fullName} (${reader.readerCode})`;
        readerSelect.appendChild(option);
    });
}

// Handle book search
function handleBookSearch() {
    const searchTerm = bookSearch.value.toLowerCase();
    const books = dataStore.getBooks().filter(book => 
        book.status === 'available' && 
        (book.title.toLowerCase().includes(searchTerm) || 
         book.category.toLowerCase().includes(searchTerm))
    );

    bookSelect.innerHTML = '<option value="">Select a book</option>';
    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book.id;
        option.textContent = `${book.title} (${book.category})`;
        bookSelect.appendChild(option);
    });
}

// Handle reader search
function handleReaderSearch() {
    const searchTerm = readerSearch.value.toLowerCase();
    const readers = dataStore.getReaders().filter(reader =>
        reader.fullName.toLowerCase().includes(searchTerm) ||
        reader.readerCode.toLowerCase().includes(searchTerm)
    );

    readerSelect.innerHTML = '<option value="">Select a reader</option>';
    readers.forEach(reader => {
        const option = document.createElement('option');
        option.value = reader.id;
        option.textContent = `${reader.fullName} (${reader.readerCode})`;
        readerSelect.appendChild(option);
    });
}

// Handle borrow form submission
async function handleBorrowSubmit(e) {
    e.preventDefault();

    const bookId = bookSelect.value;
    const readerId = readerSelect.value;
    const dueDate = document.getElementById('dueDate').value;

    if (!bookId || !readerId || !dueDate) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Check if reader has reached maximum allowed books
    const readerBorrowings = dataStore.getBorrowings().filter(
        b => b.readerId === readerId && b.status === 'borrowed'
    );
    if (readerBorrowings.length >= 5) {
        showNotification('Reader has reached maximum allowed books (5)', 'error');
        return;
    }

    const borrowing = {
        bookId,
        readerId,
        dueDate,
        status: 'borrowed'
    };

    try {
        const success = dataStore.addBorrowing(borrowing);
        if (success) {
            // Update book status
            dataStore.updateBook(bookId, { status: 'borrowed' });
            
            // Update reader's borrow count
            const reader = dataStore.getReaders().find(r => r.id === readerId);
            if (reader) {
                dataStore.updateReader(readerId, {
                    borrowCount: (reader.borrowCount || 0) + 1
                });
            }

            showNotification('Book borrowed successfully');
            borrowForm.reset();
            loadBorrowedBooks();
            initializeSelects();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Load and display borrowed books
function loadBorrowedBooks() {
    const borrowings = dataStore.getBorrowings().filter(b => b.status === 'borrowed');
    borrowedBooksTableBody.innerHTML = '';

    borrowings.forEach(borrowing => {
        const book = dataStore.getBooks().find(b => b.id === borrowing.bookId);
        const reader = dataStore.getReaders().find(r => r.id === borrowing.readerId);
        const row = document.createElement('tr');

        const isOverdue = new Date(borrowing.dueDate) < new Date();
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${book ? book.title : 'Unknown Book'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${reader ? reader.fullName : 'Unknown Reader'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${new Date(borrowing.borrowDate).toLocaleDateString()}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}">
                    ${new Date(borrowing.dueDate).toLocaleDateString()}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${isOverdue ? 'Overdue' : 'Borrowed'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="openReturnModal('${borrowing.id}')" class="text-blue-600 hover:text-blue-900">
                    Return Book
                </button>
            </td>
        `;
        borrowedBooksTableBody.appendChild(row);
    });
}

// Open return modal
function openReturnModal(borrowingId) {
    const borrowing = dataStore.getBorrowings().find(b => b.id === borrowingId);
    if (!borrowing) return;

    const book = dataStore.getBooks().find(b => b.id === borrowing.bookId);
    const reader = dataStore.getReaders().find(r => r.id === borrowing.readerId);

    document.getElementById('returnBookTitle').textContent = book ? book.title : 'Unknown Book';
    document.getElementById('returnReaderName').textContent = reader ? reader.fullName : 'Unknown Reader';
    document.getElementById('returnBorrowDate').textContent = new Date(borrowing.borrowDate).toLocaleDateString();
    document.getElementById('returnDueDate').textContent = new Date(borrowing.dueDate).toLocaleDateString();

    currentReturnBorrowing = borrowing;
    returnModal.classList.remove('hidden');
}

// Close return modal
function closeReturnModal() {
    returnModal.classList.add('hidden');
    currentReturnBorrowing = null;
    document.getElementById('bookCondition').value = 'good';
    document.getElementById('notes').value = '';
}

// Confirm book return
function confirmReturn() {
    if (!currentReturnBorrowing) return;

    try {
        // Update borrowing status
        const success = dataStore.returnBook(currentReturnBorrowing.id);
        if (success) {
            // Update book status based on condition
            const condition = document.getElementById('bookCondition').value;
            dataStore.updateBook(currentReturnBorrowing.bookId, {
                status: condition === 'good' ? 'available' : 'damaged'
            });

            // Update reader's borrow count
            const reader = dataStore.getReaders().find(r => r.id === currentReturnBorrowing.readerId);
            if (reader && reader.borrowCount > 0) {
                dataStore.updateReader(currentReturnBorrowing.readerId, {
                    borrowCount: reader.borrowCount - 1
                });
            }

            showNotification('Book returned successfully');
            closeReturnModal();
            loadBorrowedBooks();
            initializeSelects();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Calculate days overdue
function getDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = Math.abs(today - due);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
