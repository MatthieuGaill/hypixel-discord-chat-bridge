document.getElementById('appealForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const caseId = document.getElementById('caseId').value;
    const justified = document.getElementById('justified').value;
    const explanation = document.getElementById('explanation').value || 'N/A';
    const reason = document.getElementById('reason').value;
    const additional = document.getElementById('additional').value || 'N/A';

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                caseId,
                justified,
                explanation,
                reason,
                additional
            }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('Error submitting appeal.');
    }
});

