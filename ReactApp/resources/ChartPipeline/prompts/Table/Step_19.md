

````javascript
let selectedTestPack = null;

// Attach click event to all TEST PACK buttons
document.querySelectorAll('.testpack-button').forEach(button => {
  button.addEventListener('click', () => {
    const clickedValue = button.getAttribute('data-testpack');

    if (selectedTestPack === clickedValue) {
      // Toggle off → reset filter
      selectedTestPack = null;
      showAllRecords('#isometricTable');
      showAllRecords('#mountingTable');
    } else {
      // Apply new filter
      selectedTestPack = clickedValue;
      filterTableByTestPack('#isometricTable', clickedValue);
      filterTableByTestPack('#mountingTable', clickedValue);
    }
  });
});

// Show all rows in a given table
function showAllRecords(tableSelector) {
  document.querySelectorAll(`${tableSelector} .data-row`).forEach(row => {
    row.style.display = '';
  });
}

// Filter rows by TEST PACK
function filterTableByTestPack(tableSelector, testPackValue) {
  document.querySelectorAll(`${tableSelector} .data-row`).forEach(row => {
    if (row.getAttribute('data-testpack') === testPackValue) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}
````