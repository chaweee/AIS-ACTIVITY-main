const ADAPTER_URL = 'http://localhost:3000/profiles'; 

export const fetchStudentByIdFromAdapter = async (id) => {
    try {
        const response = await fetch(`${ADAPTER_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Adapter Layer responded with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Adapter Connection Error:", error);
        throw new Error("Failed to communicate with the Adapter Layer. Is it running on port 3000?");
    }
};