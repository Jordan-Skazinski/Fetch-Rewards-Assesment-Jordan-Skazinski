//data ill use for testing
let transactions = [
  { payer: "DANNON", points: 1000, timestamp: "2020-11-02T14:00:00Z" },
  { payer: "UNILEVER", points: 200, timestamp: "2020-10-31T11:00:00Z" },
  { payer: "DANNON", points: -200, timestamp: "2020-10-31T15:00:00Z" },
  { payer: "MILLER COORS", points: 10000, timestamp: "2020-11-01T14:00:00Z" },
  { payer: "DANNON", points: 300, timestamp: "2020-10-31T10:00:00Z" },
];

let balances = [{ DANNON: 1100 }, { UNILEVER: 200 }, { "MILLER COORS": 10000 }];
//this is a helper function for transactions route
//logic fo radding one or and array of objects of transactions
function addTransaction(transaction) {
  //if the request is just the object meaning its only one transaction request
  if (!transaction.length) {
    //go through balances
    for (let j = 0; j < balances.length; j++) {
      //assign the balances payer and points var names to easly change them
      let [[key, val]] = Object.entries(balances[j]);
      //check if balances payer name is equal to the transaction payer name
      if (key === transaction.payer) {
        //add the points from the transaction request to the balances points
        val = val + transaction.points;
        //changes the balances points to be the new points total after the transaction
        balances[j][key] = val;
        //a stop case for if the transaction would put the payer in debt
        if (val < 0) {
          //instead just change their balance to 0
          balances[j][key] = 0;
        }
        transactions.push(transaction);
      }
    }
  }
  //this one is itteration through the request body if its an array with multipe transactions in it
  for (let i = 0; i < transaction.length; i++) {
    const cur = transaction[i].payer; //the current transaction
    const curTransaction = transaction[i].points; //the current transaction point total
    //iterate again through balances
    for (let j = 0; j < balances.length; j++) {
      //assign the balances payer and points var names to easly change them
      let [[key, val]] = Object.entries(balances[j]);
      //match the current transaction payer to the one in the balances array
      if (key === cur) {
        //add the points from the transaction request to the balances points
        val = val + curTransaction;
        //changes the balances points to be the new points total after the transaction
        balances[j][key] = val;
        //a stop case for if the transaction would put the payer in debt
        if (val < 0) {
          //instead just change their balance to 0
          balances[j][key] = 0;
        }
        transactions.push(transaction[i]);
      }
    }
  }
}
//this is a helper function for spend route
//sorts the timestamp dates
const sortedTransactions = transactions.sort((a, b) => {
  //first converts them into javascript timestamps so they can be sorted easly
  aDate = new Date(a.timestamp);
  bDate = new Date(b.timestamp);

  return aDate - bDate;
});
//this is a helper function for spend route
//removes the negatives from the transaction list
function removeNegatives(array) {
  //iterates through the transactions
  for (let i = 0; i < array.length; i++) {
    //checks for negatives
    if (array[i].points < 0) {
      //saves object with a negative points number to a var
      let savedNegative = array[i];
      //removes the object from the transactions array
      array.splice(i, 1);
      //iterates through transactions again
      for (let j = 0; j < array.length; j++) {
        //checks for the payer name to be matching the negative points payer name
        if (savedNegative.payer === array[j].payer) {
          //checks if the total would be a nagatice after adding the two together
          if ((array[j].points += savedNegative.points > 0)) {
            //adds the negative to the total
            array[j].points += savedNegative.points;
            break;
          }
        }
      }
    }
  }
  //console.log(array)
  return array;
}

//this is a helper function for spend route
//this will take in the product from the removeNegatives and the points request
function spending(array, pointsArray) {
  //grab the points from the request
  let spendAmount = pointsArray.points;
  //creates an array for the response
  let spentPointsList = [];
  //iterate through the transactions
  for (let i = 0; i < array.length; i++) {
    //check to make sure it stops when its used all the points from the request
    if (spendAmount === 0) {
      break;
      //checks if the current transactions points are greater than the spendAmount
    } else if (spendAmount - array[i].points < 0) {
      //saves the current opject for temp use
      let updated = array[i];
      //minus the points from the current iteration payers transactions
      array[i].points -= spendAmount;
      //set the temps objects points to the spent amount
      updated.points = spendAmount;
      //set the spend amount to 0
      spendAmount = 0;
      //push the result to the response array
      spentPointsList.push(array[i]);
    } else {
      //adds the transaction to the response array and subtracts the points
      spendAmount -= array[i].points;
      spentPointsList.push(array[i]);
    }
  }
  //this updates the balances array takeing out of their balances what was spent
  for (let i = 0; i < balances.length; i++) {
    let [[key, val]] = Object.entries(balances[i]);
    for (let j = 0; j < spentPointsList.length; j++) {
      if (key === spentPointsList[j].payer && val !== 0) {
        //console.log(spentPointsList[j].points)
        //console.log(val)
        val -= spentPointsList[j].points;
        let name = spentPointsList[j].payer;
        //console.log(balances[i][name] - val)
        balances[i][name] = val;
      }
    }
  }

  return spentPointsList;
}

//the /spend route POST controller
function updateSpend(req, res) {
  //creates a starting point that removes all negatives and
  //subtracts that negative from the first positive in the array
  const startingList = removeNegatives(sortedTransactions);
  //calls the spending function with the current request
  let spent = spending(startingList, req.body);
  //sends back the 201 created status with the created spend array
  res.status(201).json(spent);
}

//the /transactions POST route controller
async function updateTransaction(req, res) {
  //calls the addTransaction function with the request
  addTransaction(req.body);
  //sends back the 201 created status with the transactions array
  res.status(201).send(transactions);
}

//the /balances GET route controller
function list(req, res, next) {
 //this formats the balances to all be in a single object 
  let result = [];
  for (let i = 0; i < balances.length; i++) {
    const [[key, val]] = Object.entries(balances[i]);
    result.push(`${key}: ${val}`);
  }
  res.send(result);
}//the /balances GET route controller for if you want to just check the transactions array without adding anything
function listTransaction(req, res) {
  //list the transactions
  res.send(sortedTransactions);
}

module.exports = {
  updateSpend,
  updateTransaction,
  list,
  listTransaction,
};
