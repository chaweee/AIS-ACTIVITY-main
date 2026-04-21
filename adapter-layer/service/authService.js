import * as AuthAdapter from "../adapters/authAdapter.js";

export const registerStudent = async (studentProfile) => {
    if (!studentProfile.firstName || studentProfile.firstName === ''){
        throw new Error("First name is required");
    }

    if (!studentProfile.lastName || studentProfile.lastName === ''){
        throw new Error("Last name is required");
    }

    if (!studentProfile.dob || studentProfile.dob === ''){
        throw new Error("Date of birth is required");
    }

    if (!studentProfile.course || studentProfile.course === ''){
        throw new Error("Course is required");
    }

    if (!studentProfile.major || studentProfile.major === ''){
        throw new Error("Major is required");
    }

    return await AuthAdapter.create(studentProfile);
}