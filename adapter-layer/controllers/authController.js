import * as AuthService from '../service/authService.js';

export const register = async (req, res) => {
    const {id, firstName, lastName, dob, course, major, status} = req.body;

    try {
        const studentProfile = { id, firstName, lastName, dob, course, major, status };
        const result = await AuthService.registerStudent(studentProfile);
        res.status(201).json({
            success: true,
            message: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while registering the student.",
            error: error.message
        });
    }

};