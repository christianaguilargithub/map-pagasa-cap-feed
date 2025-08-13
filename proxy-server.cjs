// import express from 'express';
// import fetch from 'node-fetch';

const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = 4000;

app.get('/cap', async (req, res) => {
  try {
    const response = await fetch('https://publicalert.pagasa.dost.gov.ph/output/gfa/ca1f580c-523a-4915-a86f-4f0a4fd43bab.cap');
    if (!response.ok) {
      return res.status(response.status).send('Error fetching CAP data');
    }
    const data = await response.text();
    res.set('Content-Type', 'application/xml');
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching CAP data');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});