// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    updateSummaryCards();
    renderMonthlyChart();
    renderCategoryChart();
    renderMostBorrowedBooks();
    renderMostActiveReaders();
    renderOverdueBooks();
});

// Update summary cards with current statistics
function updateSummaryCards() {
    const books = dataStore.getBooks();
    const borrowings = dataStore.getBorrowings();
    
    // Total books
    document.getElementById('totalBooks').textContent = books.length;
    
    // Available books
    document.getElementById('availableBooks').textContent = 
        books.filter(book => book.status === 'available').length;
    
    // Currently borrowed books
    document.getElementById('borrowedBooks').textContent = 
        borrowings.filter(b => b.status === 'borrowed').length;
    
    // Overdue books
    document.getElementById('overdueBooks').textContent = 
        getOverdueBooks().length;
}

// Render monthly borrowing statistics chart
function renderMonthlyChart() {
    const borrowings = dataStore.getBorrowings();
    const monthlyData = getMonthlyBorrowingData(borrowings);
    
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Borrowed',
                    data: monthlyData.borrowed,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1
                },
                {
                    label: 'Returned',
                    data: monthlyData.returned,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Get monthly borrowing data
function getMonthlyBorrowingData(borrowings) {
    const months = [];
    const borrowed = [];
    const returned = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        months.push(monthYear);
        
        const monthBorrowings = borrowings.filter(b => {
            const borrowDate = new Date(b.borrowDate);
            return borrowDate.getMonth() === date.getMonth() &&
                   borrowDate.getFullYear() === date.getFullYear();
        });
        
        borrowed.push(monthBorrowings.length);
        
        const monthReturns = borrowings.filter(b => {
            if (!b.returnDate) return false;
            const returnDate = new Date(b.returnDate);
            return returnDate.getMonth() === date.getMonth() &&
                   returnDate.getFullYear() === date.getFullYear();
        });
        
        returned.push(monthReturns.length);
    }
    
    return { labels: months, borrowed, returned };
}

// Render books by category chart
function renderCategoryChart() {
    const books = dataStore.getBooks();
    const categories = {};
    
    books.forEach(book => {
        categories[book.category] = (categories[book.category] || 0) + 1;
    });
    
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Render most borrowed books list
function renderMostBorrowedBooks() {
    const books = dataStore.getBooks();
    const borrowings = dataStore.getBorrowings();
    
    const bookBorrowCounts = books.map(book => {
        const count = borrowings.filter(b => b.bookId === book.id).length;
        return { ...book, borrowCount: count };
    });
    
    bookBorrowCounts.sort((a, b) => b.borrowCount - a.borrowCount);
    
    const mostBorrowedList = document.getElementById('mostBorrowedBooks');
    mostBorrowedList.innerHTML = '';
    
    bookBorrowCounts.slice(0, 5).forEach(book => {
        const li = document.createElement('li');
        li.className = 'py-3';
        li.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-900">${book.title}</p>
                    <p class="text-sm text-gray-500">${book.category}</p>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${book.borrowCount} times
                </span>
            </div>
        `;
        mostBorrowedList.appendChild(li);
    });
}

// Render most active readers list
function renderMostActiveReaders() {
    const readers = dataStore.getReaders();
    const borrowings = dataStore.getBorrowings();
    
    const readerBorrowCounts = readers.map(reader => {
        const count = borrowings.filter(b => b.readerId === reader.id).length;
        return { ...reader, borrowCount: count };
    });
    
    readerBorrowCounts.sort((a, b) => b.borrowCount - a.borrowCount);
    
    const mostActiveList = document.getElementById('mostActiveReaders');
    mostActiveList.innerHTML = '';
    
    readerBorrowCounts.slice(0, 5).forEach(reader => {
        const li = document.createElement('li');
        li.className = 'py-3';
        li.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-900">${reader.fullName}</p>
                    <p class="text-sm text-gray-500">${reader.readerCode}</p>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ${reader.borrowCount} books
                </span>
            </div>
        `;
        mostActiveList.appendChild(li);
    });
}

// Get overdue books
function getOverdueBooks() {
    const borrowings = dataStore.getBorrowings();
    const today = new Date();
    
    return borrowings.filter(b => 
        b.status === 'borrowed' && new Date(b.dueDate) < today
    );
}

// Calculate days overdue
function getDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = Math.abs(today - due);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Render overdue books table
function renderOverdueBooks() {
    const overdueBooks = getOverdueBooks();
    const tableBody = document.getElementById('overdueTableBody');
    tableBody.innerHTML = '';
    
    if (overdueBooks.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                No overdue books
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    overdueBooks.forEach(borrowing => {
        const book = dataStore.getBooks().find(b => b.id === borrowing.bookId);
        const reader = dataStore.getReaders().find(r => r.id === borrowing.readerId);
        const daysOverdue = getDaysOverdue(borrowing.dueDate);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${book ? book.title : 'Unknown Book'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${reader ? reader.fullName : 'Unknown Reader'}</div>
                <div class="text-sm text-gray-500">${reader ? reader.readerCode : ''}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${new Date(borrowing.dueDate).toLocaleDateString()}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ${daysOverdue} days
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
