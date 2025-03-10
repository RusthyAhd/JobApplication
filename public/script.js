// Hooking up the form to do its thing
document.getElementById('applicationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Grabbing the pieces we need
    const formData = new FormData(this);
    const status = document.getElementById('status');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');

    try {
        // Flip on the loading spinner and lock the button
        btnText.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        submitBtn.disabled = true;

        // Fire off the form data to the server
        const response = await fetch('http://localhost:3000/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Server hiccupped');

        // Sweet, it worked—show the success message
        status.classList.remove('hidden', 'text-red-600');
        status.classList.add('text-green-600', 'animate-fade-in');
        status.textContent = result.message;

        // Clear the form for next time
        this.reset();

        // Reset the button to normal
        btnText.classList.remove('hidden');
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;

        // Hide the status after a bit
        setTimeout(() => {
            status.classList.add('hidden');
        }, 10000); // 10 seconds feels right
    } catch (error) {
        // Uh-oh, trouble—let’s show the error
        status.classList.remove('hidden', 'text-green-600');
        status.classList.add('text-red-600', 'animate-fade-in');
        status.textContent = error.message || 'Error submitting application. Give it another shot.';
        console.error('Client Error:', error);

        // Reset the button even if it fails
        btnText.classList.remove('hidden');
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
});