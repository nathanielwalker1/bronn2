document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const findPoolsButton = document.getElementById('findPools');
    const buttonText = findPoolsButton.querySelector('.button-text');
    const priceRangeInput = document.getElementById('priceRange');
    const timePeriodInput = document.getElementById('timePeriod');
    const minVolumeInput = document.getElementById('minVolume');
    const poolsTable = document.getElementById('poolsTable').getElementsByTagName('tbody')[0];
    const noResults = document.getElementById('noResults');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    // Store the mock data
    let mockData = [];

    // Hide all status messages
    function hideAllMessages() {
        noResults.classList.add('hidden');
        loading.classList.add('hidden');
        error.classList.add('hidden');
    }

    // Set button loading state
    function setButtonLoading(isLoading) {
        findPoolsButton.disabled = isLoading;
        findPoolsButton.classList.toggle('loading', isLoading);
        buttonText.textContent = isLoading ? 'Loading...' : 'Find Pools';
    }

    // Fetch mock data on page load
    async function loadMockData() {
        try {
            hideAllMessages();
            loading.classList.remove('hidden');
            const response = await fetch('data/mockData.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            mockData = await response.json();
            console.log('Mock data loaded successfully:', mockData);
        } catch (error) {
            console.error('Error loading mock data:', error);
            hideAllMessages();
            document.getElementById('error').classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    }

    // Format volume for display (e.g., 12800000 to "$12.8M")
    function formatVolume(volume) {
        const millions = volume / 1000000;
        return `$${millions.toFixed(1)}M`;
    }

    // Format price range for display (e.g., 4.2 to "±4.2%")
    function formatPriceRange(priceRange) {
        const value = priceRange.toString();
        return value.startsWith('±') ? value : `±${value}%`;
    }

    // Format time period for display (e.g., 30 to "30d")
    function formatTimePeriod(timePeriod) {
        const value = timePeriod.toString();
        return value.endsWith('d') ? value : `${value}d`;
    }

    // Safely convert string to number, returning null if invalid
    function safeParseNumber(value) {
        const num = Number(value);
        return isNaN(num) ? null : num;
    }

    // Check if pool has all required data
    function hasRequiredData(pool) {
        return (
            pool.pair &&
            pool.priceRange !== undefined &&
            pool.volume !== undefined &&
            pool.timePeriod !== undefined
        );
    }

    // Filter pools based on user input
    function filterPools() {
        // Safely convert inputs to numbers
        const userPriceRange = safeParseNumber(priceRangeInput.value);
        const userTimePeriod = safeParseNumber(timePeriodInput.value);
        const userMinVolume = safeParseNumber(minVolumeInput.value);

        // Validate inputs
        if (userPriceRange === null || userTimePeriod === null || userMinVolume === null) {
            console.error('Invalid input values');
            return [];
        }

        return mockData.filter(pool => {
            // Skip pools with missing data
            if (!hasRequiredData(pool)) {
                console.warn('Skipping pool with missing data:', pool);
                return false;
            }

            // Convert pool values to numbers
            const poolPriceRange = safeParseNumber(pool.priceRange);
            const poolVolume = safeParseNumber(pool.volume);
            const poolTimePeriod = safeParseNumber(pool.timePeriod);

            // Skip if any pool values are invalid
            if (poolPriceRange === null || poolVolume === null || poolTimePeriod === null) {
                console.warn('Skipping pool with invalid numeric values:', pool);
                return false;
            }

            // Compare values
            return poolPriceRange <= userPriceRange && // Price range within user's limit
                   poolTimePeriod === userTimePeriod && // Time period must match exactly
                   poolVolume >= userMinVolume;        // Volume meets minimum threshold
        });
    }

    // Display filtered results in the table
    function displayResults(filteredPools) {
        // Clear existing results
        poolsTable.innerHTML = '';
        hideAllMessages();

        if (filteredPools.length === 0) {
            noResults.classList.remove('hidden');
            return;
        }

        // Add each pool to the table
        filteredPools.forEach(pool => {
            const row = poolsTable.insertRow();
            row.insertCell(0).textContent = pool.pair;
            row.insertCell(1).textContent = formatPriceRange(pool.priceRange);
            row.insertCell(2).textContent = formatVolume(pool.volume);
            row.insertCell(3).textContent = formatTimePeriod(pool.timePeriod);
            row.insertCell(4).textContent = ''; // Empty APR column for now
        });
    }

    // Handle Find Pools button click
    async function handleFindPools() {
        try {
            setButtonLoading(true);
            hideAllMessages();
            poolsTable.innerHTML = '';

            // Simulate API delay (remove this in production)
            await new Promise(resolve => setTimeout(resolve, 500));

            const filteredPools = filterPools();
            displayResults(filteredPools);
        } catch (error) {
            console.error('Error finding pools:', error);
            hideAllMessages();
            document.getElementById('error').classList.remove('hidden');
        } finally {
            setButtonLoading(false);
        }
    }

    // Event Listeners
    findPoolsButton.addEventListener('click', handleFindPools);

    // Load mock data when page loads
    loadMockData();
});
