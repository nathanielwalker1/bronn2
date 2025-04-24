console.log('script.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const findPoolsButton = document.getElementById('findPools');
    console.log('Find Pools button:', findPoolsButton);

    if (!findPoolsButton) {
        console.error('Error: Could not find button with ID "findPools"');
        return;
    }

    const buttonText = findPoolsButton.querySelector('.button-text');
    if (!buttonText) {
        console.error('Error: Could not find .button-text element inside button');
        return;
    }

    const priceRangeInput = document.getElementById('priceRange');
    const timePeriodInput = document.getElementById('timePeriod');
    const minVolumeInput = document.getElementById('minVolume');
    const poolsTable = document.getElementById('poolsTable').getElementsByTagName('tbody')[0];
    const noResults = document.getElementById('noResults');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');

    // Dune API configuration
    const DUNE_API_KEY = '8YgPlZmcWMavDKQOULl9JyeMoFA8H2EM';
    const QUERY_ID = '5017656';

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

    // Execute Dune query and wait for results
    async function executeDuneQuery() {
        try {
            console.log('Starting query execution...');
            const executeResponse = await fetch('https://api.dune.com/api/v1/query/' + QUERY_ID + '/execute', {
                method: 'POST',
                headers: {
                    'x-dune-api-key': DUNE_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            console.log('Got executeResponse:', executeResponse.status, executeResponse.statusText);

            // Log raw response text before parsing
            const rawText = await executeResponse.text();
            console.log('Raw response text:', rawText);

            if (!executeResponse.ok) {
                throw new Error(`Failed to execute query: ${executeResponse.statusText}`);
            }

            console.log('Parsing execution response JSON...');
            const executionData = JSON.parse(rawText);
            console.log('Execution data:', executionData);
            console.log('Execution ID:', executionData.execution_id);

            if (!executionData.execution_id) {
                throw new Error('No execution_id in response');
            }

            // Poll for results
            let results;
            while (true) {
                console.log('Checking query status...');
                const statusResponse = await fetch('https://api.dune.com/api/v1/execution/' + executionData.execution_id + '/status', {
                    headers: {
                        'x-dune-api-key': DUNE_API_KEY,
                        'Accept': 'application/json'
                    },
                    mode: 'cors'
                });
                console.log('Got status response:', statusResponse.status, statusResponse.statusText);

                if (!statusResponse.ok) {
                    throw new Error(`Failed to check status: ${statusResponse.statusText}`);
                }

                console.log('Parsing status JSON...');
                const status = await statusResponse.json();
                console.log('Status:', status);
                
                if (status.state === 'QUERY_STATE_COMPLETED') {
                    console.log('Query completed, fetching results...');
                    const resultsResponse = await fetch('https://api.dune.com/api/v1/execution/' + executionData.execution_id + '/results', {
                        headers: {
                            'x-dune-api-key': DUNE_API_KEY,
                            'Accept': 'application/json'
                        },
                        mode: 'cors'
                    });
                    console.log('Got results response:', resultsResponse.status, resultsResponse.statusText);

                    if (!resultsResponse.ok) {
                        throw new Error(`Failed to fetch results: ${resultsResponse.statusText}`);
                    }

                    console.log('Parsing results JSON...');
                    results = await resultsResponse.json();
                    console.log('Results:', results);
                    break;
                } else if (status.state === 'QUERY_STATE_FAILED') {
                    throw new Error('Query execution failed: ' + (status.error || 'Unknown error'));
                }

                console.log('Query still running, waiting 2 seconds...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Transform Dune results to match our expected format
            console.log('Transforming results...');
            const transformedResults = results.result.rows.map(row => {
                // Safely handle null/undefined values with fallbacks
                const priceRange = row.price_range_pct != null ? row.price_range_pct.toString() : '0';
                const volume = row.volume_usd != null ? row.volume_usd : 0;
                const pair = row.pair || 'Unknown Pair';
                const days = row.days_active != null ? row.days_active : 0;

                console.log('Transforming row:', {
                    original: row,
                    transformed: { pair, priceRange, volume, days }
                });

                return {
                    pair,
                    priceRange,
                    volume,
                    timePeriod: 30 // Since our query is fixed at 30 days
                };
            });
            console.log('Transformed results:', transformedResults);
            return transformedResults;

        } catch (error) {
            console.error('Error fetching from Dune:', error.message || error);
            throw error;
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
    function filterPools(pools) {
        // Safely convert inputs to numbers
        const userPriceRange = safeParseNumber(priceRangeInput.value);
        const userTimePeriod = safeParseNumber(timePeriodInput.value);
        const userMinVolume = safeParseNumber(minVolumeInput.value);

        // Validate inputs
        if (userPriceRange === null || userTimePeriod === null || userMinVolume === null) {
            console.error('Invalid input values');
            return [];
        }

        return pools.filter(pool => {
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
        console.log('Button clicked');
        try {
            console.log('Starting Dune query fetch...');
            setButtonLoading(true);
            hideAllMessages();
            poolsTable.innerHTML = '';

            // Fetch data from Dune
            const pools = await executeDuneQuery();
            console.log('Received pools from Dune:', pools);
            
            // Filter and display results
            const filteredPools = filterPools(pools);
            console.log('Filtered pools:', filteredPools);
            displayResults(filteredPools);
        } catch (error) {
            console.error('Error finding pools:', error.message || error);
            hideAllMessages();
            document.getElementById('error').classList.remove('hidden');
        } finally {
            setButtonLoading(false);
        }
    }

    // Event Listeners
    console.log('Setting up event listener...');
    findPoolsButton.addEventListener('click', handleFindPools);
    console.log('Event listener set up complete');
});
