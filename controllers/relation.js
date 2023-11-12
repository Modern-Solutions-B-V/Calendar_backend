const axios = require('axios');
const { response } = require('express');

async function getClientById(number) {
    const url = `https://huski.1tis.nl/api/modernsolutions/crm/v1/relation`;

    try {
        const response = await axios.post(url, { number }, {
            headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching client:', error.message)
        throw error;
    }
}


async function getUpdatedClientByDateRange(range) {
    try {
        const response = await axios.post(`https://huski.1tis.nl/api/modernsolutions/crm/v1/relation/changes`, range, {
            headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching updated client:', error.message);
        throw error;
    }
}


async function getBookingById(number) {
    const url = `https://huski.1tis.nl/api/modernsolutions/crm/v1/booking`;
    try {
        const response = await axios.post(url, { number }, {
            headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching booking:', error.message)
        throw error;
    }
}



async function getBookingChange(range) {
    try {
        const response = await axios.post(`https://huski.1tis.nl/api/modernsolutions/crm/v1/booking/changes`, range, {
            headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching booking :', error.message);
        throw error;
    }
}


module.exports = { getClientById, getUpdatedClientByDateRange, getBookingById, getBookingChange };