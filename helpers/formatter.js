const phoneNumberFormatter = (number) => {
    // Remove non digit character
    let formatted = number.replace(/\D/g, '');
    // Remove '0' prefix and change with '62'
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substr(1);
    }
    // Remove '+62' prefix and change with '62'
    if (formatted.startsWith('+62')) {
        formatted = formatted.substr(1);
    }
    // Add @c.us postfix
    if (!formatted.endsWith('@c.us')) {
        formatted += '@c.us';
    }

    return formatted;
}

module.exports = {
    phoneNumberFormatter
}