var app = angular.module("crm", ["ngRoute","datatables"]);
app.config(function($routeProvider,$locationProvider) {
  $routeProvider
  .when("/", {
    templateUrl : "views/home.html",
    controller : "homeController"
  })
  .when("/addProduct", {
    templateUrl : "views/addproduct.html",
    controller : "addproductController"
  })
  .when("/viewProducts", {
    templateUrl : "views/viewproduct.html",
    controller : "viewproductController"
  })
  .when("/addStock", {
    templateUrl : "views/addstock.html",
    controller : "addstockController"
  })
  .when("/deleteProducts",{
    templateUrl : "views/deleteProducts.html",
    controller : "deleteProductsController"
  })
  .when("/createInvoice", {
    templateUrl : "views/createinvoice.html",
    controller : "createinvoiceController"
  })
  .when("/viewInvoices", {
    templateUrl : "views/viewinvoice.html",
    controller : "viewinvoiceController"
  })
  .when("/createBarcode", {
    templateUrl : "views/createbarcode.html",
    controller : "createbarcodeController"
  })
  .when("/pendingInvoices", {
    templateUrl : "views/pendingInvoices.html",
    controller : "pendingInvoicesController"
  })
  .otherwise({
    redirectTo: '/'
  })
  $locationProvider.hashPrefix('!');
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: true
  });

});

app.controller("homeController",function($scope){
    $scope.msg = "Hello";
});

app.controller("addproductController",function($scope,$http){
  $scope.alertType = false;
  $scope.addProduct= function(){
    let productcode = $scope.productCode.toUpperCase();
    let productname = $scope.productName.toUpperCase();
    let productunit = $scope.productUnit.toUpperCase();
    
    let data = {productCode : productcode,
    productname : productname,
    productrate : $scope.productRate,
    productstock : $scope.productStock,
    productunit : productunit}; 
    $http.post("./php/addproduct.php",data).then(function(res){
      $scope.alertType = true;
      $scope.alertmsg = res.data;
      $scope.productCode = $scope.productRate =  $scope.productStock = $scope.productName = $scope.productUnit = "";
    });
  }
});
app.controller("viewproductController",function($scope,$http){
  $http.get("./php/fetchProduct.php").then(function(res){
    $scope.products = res.data;
    console.log(res.data);
    
  });
});
app.controller("addstockController",function($scope,$http){

  // autofill  code
  $scope.dropdown = false;
  // Fetch data
  $scope.fetchUsers = function(){
                
    var searchText_len = $scope.productCode.trim().length;

    // Check search text length
    if(searchText_len > 0){
       $http({
         method: 'POST',
         url: './php/getDataByCode.php',
         data: {searchText:$scope.productCode}
       }).then(function successCallback(response) {
        if (Object.keys(response.data).length > 0) {
          $scope.dropdown = true;
          $scope.searchResult = response.data;
         } else {
          $scope.dropdown = false;
          $scope.searchResult = {};
         } 
       });
    }else{
      $scope.dropdown = false;
       $scope.searchResult = {};
    }
              
 }

 // Set value to search box
 $scope.setValue = function(index,$event){
    $scope.productCode = $scope.searchResult[index].name;
    $scope.searchResult = {};
    $event.stopPropagation();
    $scope.dropdown = false;
 }

 $scope.searchboxClicked = function($event){
    $event.stopPropagation();
    $scope.dropdown = false;
 }

 $scope.containerClicked = function(){
    $scope.searchResult = {};
    $scope.dropdown = false;
 }
  // autofill code

  $scope.alertType = false;
  let code ="";
  let stock = "";
  
  $scope.validateproduct = function(){
    let data = {productCode:$scope.productCode};
    $http.post("./php/validateproduct.php",data)
    .then(function(res){
      console.log(typeof(res.data));
      if (typeof(res.data)=='object') {
        $scope.productName = res.data.productname;
      $scope.productRate = res.data.productrate;
      $scope.productStock = res.data.productstock;
      $scope.productUnit= res.data.productunit;
      code =res.data.productcode;
      stock = parseInt(res.data.productstock);
      } else {
        $scope.alertType = true;
        $scope.alertmsg = res.data;
      }
      
     
    })
  }

  $scope.addStock = function(){
   
    $http.post("./php/addstock.php",{
      productCode:code,
      newStock:$scope.newStock+stock
    }).then(function(res){
      $scope.alertType = true;
      $scope.alertmsg = res.data;
      $scope.productCode = $scope.productRate =  $scope.productStock = $scope.productName = $scope.productUnit = $scope.newStock = "";
    })

  };
  
});
// app.controller("createinvoiceController",function($scope,$http){
//   stocks = {};
//   discountedtotal = 0;
//   $scope.productdiscount = $scope.discount = $scope.actualprice = $scope.totalprice = $scope.total = $scope.actualtotal = $scope.productdiscount = 0;
//   $scope.alertType = false;
//   total = 0;
//   actualtotal = 0;
//   $scope.items = [];
//   let billNo;

//   // autofill  code
//   $scope.dropdown = false;
//   // Fetch data
//   $scope.fetchUsers = function(){
                
//     var searchText_len = $scope.productCode.trim().length;

//     // Check search text length
//     if(searchText_len > 0){
//       $http({
//          method: 'POST',
//          url: './php/getDataByCode.php',
//          data: {searchText:$scope.productCode}
//       }).then(function successCallback(response) {
//         if (Object.keys(response.data).length > 0) {
//           $scope.dropdown = true;
//           $scope.searchResult = response.data;
//          } else {
//           $scope.dropdown = false;
//           $scope.searchResult = {};
//          } 
//       });
//     }else{
//       $scope.dropdown = false;
//       $scope.searchResult = {};
//     }
              
//  }

//  // Set value to search box
//  $scope.setValue = function(index,$event){
//     $scope.productCode = $scope.searchResult[index].name;
//     $scope.searchResult = {};
//     $event.stopPropagation();
//     $scope.dropdown = false;
//     console.log($scope.productCode);
    
//     let data = {productCode:$scope.productCode};
//       $http.post("./php/validateproduct.php",data)
//     .then(function(res){
//     $scope.productname = res.data.productname;
//     $scope.productrate = res.data.productrate;
//     if(!stocks.hasOwnProperty($scope.productCode))
//     {
//       console.log('adding to ',stocks);
//       stocks[$scope.productCode] = res.data.productstock;
//       console.log('added ',stocks);
      
//     }
//     $scope.productstock = stocks[$scope.productCode];
//     $scope.productunit = res.data.productunit;
//     code =res.data.productcode;
//     stock = parseInt(res.data.productstock);
//     })
//  }

//  $scope.searchboxClicked = function($event){
//     $event.stopPropagation();
//     $scope.dropdown = false;
//  }

//  $scope.containerClicked = function(){
//     $scope.searchResult = {};
//     $scope.dropdown = false;
//  }
//   // autofill code
  
//   $http.post("./php/invoicenumber.php",{}).then(function(res){
//     console.log(res.data["count(*)"]);
//     $scope.billnumber = parseInt(res.data["count(*)"])+1;
//     billNo = $scope.billnumber;
//   })

//   $scope.additem = function(){
//     if($scope.productquantity > $scope.productstock)
//     {
//       $scope.alertType = true;
//       $scope.alertmsg = "Quantity cannot be greater than stock";
//       return
//     }
//     present = false;
//     for(let i = 0;i<$scope.items.length;i++)
//     {
//       if($scope.items[i].code == $scope.productCode)
//       {
//         if($scope.items[i].discount == $scope.productdiscount)
//         {
//           $scope.items[i].quantity += $scope.productquantity;
//           present = true;
//         }
//       }
//     }
//     if(!present)
//     {
//       $scope.items.push({
//       code:$scope.productCode,
//       name:$scope.productname,
//       unit:$scope.productunit,
//       rate:$scope.productrate,
//       quantity:$scope.productquantity,
//       discount:$scope.productdiscount
//     })
//     }
//     stocks[code] = stocks[code] - $scope.productquantity;
//     console.log(code,stocks[code]);
//     total += ((100-$scope.productdiscount)*($scope.productrate*$scope.productquantity))/100;
//     discountedtotal = (100 - $scope.discount) * total/100;
//     console.log("discounted total is ",discountedtotal);
//     actualtotal += ($scope.productrate*$scope.productquantity);
//     $scope.total = discountedtotal;
//     $scope.actualtotal = actualtotal;
//     $scope.totaldiscount = (100-((discountedtotal*100)/actualtotal)).toFixed(2);
//     $scope.productdiscount = $scope.actualprice = $scope.totalprice = $scope.actualtotal = 0;
//     $scope.productname = $scope.productrate = $scope.productstock = $scope.productunit = 0;
//     $scope.productquantity = 1;
//     $scope.productCode = ""; 
//     $scope.alertType = true;
//     $scope.alertmsg = "Product Added to Invoice";
//   }
//   $scope.removeitem = function(index){
//     console.log($scope.items[index]);
//     stocks[$scope.items[index].code] += $scope.items[index].quantity;
//     total = total - ((100-$scope.items[index].discount)*($scope.items[index].rate*$scope.items[index].quantity))/100;
//     actualtotal = actualtotal - ($scope.items[index].rate*$scope.items[index].quantity)
//     discountedtotal = (100 - $scope.discount)*total/100;
//     $scope.total = discountedtotal;
//     $scope.actualtotal = actualtotal;
//     if(actualtotal == 0)
//     {
//       $scope.totaldiscount = 0;
//     }
//     else
//     {
//       $scope.totaldiscount = (100-((discountedtotal*100)/actualtotal)).toFixed(2);
//     }
    
//     $scope.items.splice(index, 1)
//     $scope.alertType = true;
//     $scope.alertmsg = "Product Removed from Invoice";
//   }
//   $scope.changediscount = function($event)
//   {
//       discountedtotal = (100-$scope.discount) * total/100;
//       $scope.totaldiscount = (100-((discountedtotal*100)/actualtotal)).toFixed(2);
//       $scope.total = discountedtotal;
//   }
//   $scope.submit = function(){
//     var count = $scope.items.length;
//     if(count <= 0)
//     {
//       $scope.alertType = true;
//       $scope.alertmsg = "Bill cannot be created with zero items";
//       return;
//     }
//     else{
//       var d = new Date();
//     let data = {
//       bill:billNo,
//       items:$scope.items,
//       number:billNo,
//       customer:$scope.customername,
//       address:$scope.address,
//       date:d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate(),
//       count:count,
//       total:Math.ceil(discountedtotal),
//       discount:$scope.totaldiscount,
//       paid : $scope.paid,
//       paymenttype : $scope.paymenttype
//     }
//     $http.post("./php/addinvoice.php",data).then((res)=>{
//       stocks = {};
//       console.log(res.data);
//       $scope.customername = $scope.address = $scope.paymenttype = $scope.paid = "";
//       $scope.items = [];
//       $scope.alertType = true;
//       $scope.alertmsg = "Bill Created Successfully";
//     //   $http.post("./php/viewinvoicebyid.php",{data:billNo})
//     // .then((res)=>{
//     //   console.log(res.data);
//     // });

//     $http.post("./php/viewinvoicebyid.php",{data:billNo})
//     .then((res)=>{
//       $http.post("./php/invoice.php",{id:billNo})
//       .then((res)=>{
//         $scope.data = {};
//         tot = 0
//       $scope.data.order = res.data;
//       // for(d in $scope.data.order)
//       // {
//       //   tot += ((100-$scope.data.order[d]['discount'])*$scope.data.order[d]['quantity']*$scope.data.order[d]['rate'])/100
//       // }
//       console.log("data",$scope.data.order)
//       $scope.data.id = billNo;
//       $scope.data.customer = data.customer;
//       $scope.data.address = data.address;
//       $scope.data.date = data.date;
//       $scope.data.discount = data.discount;
//       $scope.data.count = data.count;
//       $scope.data.amount = data.total;
//       $scope.data.paymenttype = data.paymenttype;
//       $scope.data.paid = data.paid;
//       // $scope.data.total = tot;
//       // console.log("total is ",tot)

//       console.log("scope data fdgfdgkljfdkg",$scope.data)
//       });
//       console.log(res.data);
      
//     });
//     console.log("bill created");
//     })
//     $("#basicExampleModal").modal("show")
//     }
//   }
//   $scope.printDiv = function() {
//     var printContents = document.getElementById("invoicedata").innerHTML;
//     // var originalContents = document.body.innerHTML;

//     // document.body.innerHTML = printContents;

//     // window.print();

//     var popupWinindow = window.open('', '_blank', 'toolbar=no,location=no,status=no,titlebar=no,date=no');
//     popupWinindow.document.open();
//     popupWinindow.document.write('<html><head></head><body onload="window.print()">' + printContents + '</body></html>');
//     popupWinindow.document.close();

//     // document.body.innerHTML = originalContents;
// }
// });

app.controller("createinvoiceController",function($scope,$http){
  stocks = {};
  discountedtotal = 0;
  $scope.productdiscount = $scope.discount = $scope.actualprice = $scope.totalprice = $scope.total = $scope.actualtotal = $scope.productdiscount = 0;
  $scope.alertType = false;
  total = 0;
  actualtotal = 0;
  $scope.items = [];
  let billNo;

  // autofill  code
  $scope.dropdown = false;
  // Fetch data
  $scope.fetchUsers = function(){
                
    var searchText_len = $scope.productCode.trim().length;

    // Check search text length
    if(searchText_len > 0){
       $http({
         method: 'POST',
         url: './php/getDataByCode.php',
         data: {searchText:$scope.productCode}
       }).then(function successCallback(response) {
        if (Object.keys(response.data).length > 0) {
          $scope.dropdown = true;
          $scope.searchResult = response.data;
         } else {
          $scope.dropdown = false;
          $scope.searchResult = {};
         } 
       });
    }else{
      $scope.dropdown = false;
       $scope.searchResult = {};
    }
              
 }

 // Set value to search box
 $scope.setValue = function(index,$event){
    $scope.productCode = $scope.searchResult[index].name;
    $scope.searchResult = {};
    $event.stopPropagation();
    $scope.dropdown = false;
    console.log($scope.productCode);
    
    let data = {productCode:$scope.productCode};
      $http.post("./php/validateproduct.php",data)
    .then(function(res){
    $scope.productname = res.data.productname;
    $scope.productrate = res.data.productrate;
    if(!stocks.hasOwnProperty($scope.productCode))
    {
      console.log('adding to ',stocks);
      stocks[$scope.productCode] = res.data.productstock;
      console.log('added ',stocks);
      
    }
    $scope.productstock = stocks[$scope.productCode];
    $scope.productunit = res.data.productunit;
    code =res.data.productcode;
    stock = parseInt(res.data.productstock);
    })
 }

 $scope.searchboxClicked = function($event){
    $event.stopPropagation();
    $scope.dropdown = false;
 }

 $scope.containerClicked = function(){
    $scope.searchResult = {};
    $scope.dropdown = false;
 }
  // autofill code
  
  $http.post("./php/invoicenumber.php",{}).then(function(res){
    console.log(res.data["count(*)"]);
    $scope.billnumber = parseInt(res.data["count(*)"])+1;
    billNo = $scope.billnumber;
  })

  $scope.additem = function(){
    if($scope.productquantity > $scope.productstock)
    {
      $scope.alertType = true;
      $scope.alertmsg = "Quantity cannot be greater than stock";
      return
    }
    present = false;
    for(let i = 0;i<$scope.items.length;i++)
    {
      if($scope.items[i].code == $scope.productCode)
      {
       
        if($scope.items[i].selfdiscount == false && $scope.productdiscount == 0)
        {
          $scope.items[i].quantity += $scope.productquantity;
          present = true;
        }
        else if ($scope.items[i].discount == $scope.productdiscount && $scope.items[i].selfdiscount == true)
        {
          $scope.items[i].quantity += $scope.productquantity;
          present = true;
        }
      }
    }
    if(!present)
    {
        if($scope.productdiscount == 0 || $scope.productdiscount == null)
        {
          $scope.items.push({
          code:$scope.productCode,
          name:$scope.productname,
          unit:$scope.productunit,
          rate:$scope.productrate,
          quantity:$scope.productquantity,
          discount:$scope.discount,
          selfdiscount:false
          })
        }
        else
        {
          $scope.items.push({
          code:$scope.productCode,
          name:$scope.productname,
          unit:$scope.productunit,
          rate:$scope.productrate,
          quantity:$scope.productquantity,
          discount:$scope.productdiscount,
          selfdiscount: true
          })
        }
    }
    stocks[code] = stocks[code] - $scope.productquantity;
    console.log(code,stocks[code]);

    // total += ((100-$scope.productdiscount)*($scope.productrate*$scope.productquantity))/100;
    if($scope.productdiscount == 0)
    {
      total += ((100-$scope.discount)*($scope.productrate*$scope.productquantity))/100;
      console.log("only global discount")
    }
    else
    {
      total += ((100-$scope.productdiscount)*($scope.productrate*$scope.productquantity))/100;
      console.log("only product discount")
    }
    discountedtotal = total;

    // discountedtotal = (100 - $scope.discount) * total/100;
    console.log("discounted total is ",discountedtotal);
    actualtotal += ($scope.productrate*$scope.productquantity);
    $scope.total = discountedtotal;
    $scope.actualtotal = actualtotal;
    $scope.totaldiscount = (100-((discountedtotal*100)/actualtotal)).toFixed(2);
    $scope.productdiscount = $scope.actualprice = $scope.totalprice = $scope.actualtotal = 0;
    $scope.productname = $scope.productrate = $scope.productstock = $scope.productunit = 0;
    $scope.productquantity = 1;
    $scope.productCode = ""; 
    $scope.alertType = true;
    $scope.alertmsg = "Product Added to Invoice";
  }

  $scope.removeitem = function(index){
    console.log($scope.items[index]);
    stocks[$scope.items[index].code] += $scope.items[index].quantity;

    total = total - ((100-$scope.items[index].discount)*($scope.items[index].rate*$scope.items[index].quantity))/100;  
    discountedtotal = total
    // total = total - ((100-$scope.items[index].discount)*($scope.items[index].rate*$scope.items[index].quantity))/100;
    actualtotal = actualtotal - ($scope.items[index].rate*$scope.items[index].quantity)
    // discountedtotal = (100 - $scope.discount)*total/100;
    $scope.total = discountedtotal;
    $scope.actualtotal = actualtotal;
    if(actualtotal == 0)
    {
      $scope.totaldiscount = 0;
    }
    else
    {
      $scope.totaldiscount = (100-((discountedtotal*100)/actualtotal)).toFixed(2);
    }
    
    $scope.items.splice(index, 1)
    $scope.alertType = true;
    $scope.alertmsg = "Product Removed from Invoice";
  }
 
  $scope.changediscount = function($event)
  {

    if(($scope.discount) == null){
      $scope.discount = 0
    }

    for(let i = 0;i<$scope.items.length;i++)
    {
      if($scope.items[i].selfdiscount == false)
      {
        console.log("its false");
        console.log("item discount was",$scope.items[i].discount)

        
        total += ($scope.items[i].discount*$scope.items[i].rate*$scope.items[i].quantity)/100;
        
        $scope.items[i].discount = $scope.discount;
        total -= ($scope.items[i].discount*$scope.items[i].rate * $scope.items[i].quantity)/100;
        console.log("item discount is ",$scope.items[i].discount)
        console.log("total sub",total);
        
      }
    }
    discountedtotal = total

      // discountedtotal = (100-$scope.discount) * total/100;
      $scope.totaldiscount = (100-((discountedtotal*100)/actualtotal)).toFixed(2);
      $scope.total = discountedtotal;
  }
  $scope.submit = function(){
    var count = $scope.items.length;
    if(count <= 0)
    {
      $scope.alertType = true;
      $scope.alertmsg = "Bill cannot be created with zero items";
      return;
    }
    else{
      var d = new Date();
    let data = {
      bill:billNo,
      items:$scope.items,
      number:billNo,
      customer:$scope.customername,
      address:$scope.address,
      date:d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate(),
      count:count,
      total:Math.ceil(discountedtotal),
      discount:$scope.totaldiscount,
      paid : $scope.paid,
      paymenttype : $scope.paymenttype
    }
    $http.post("./php/addinvoice.php",data).then((res)=>{
      stocks = {};
      console.log(res.data);
      $scope.customername = $scope.address = $scope.paymenttype = $scope.paid = "";
      $scope.items = [];
      $scope.alertType = true;
      $scope.alertmsg = "Bill Created Successfully";

    $http.post("./php/viewinvoicebyid.php",{data:billNo})
    .then((res)=>{
      $http.post("./php/invoice.php",{id:billNo})
      .then((res)=>{
        $scope.data = {};
        tot = 0
      $scope.data.order = res.data;
      console.log("data",$scope.data.order)
      $scope.data.id = billNo;
      $scope.data.customer = data.customer;
      $scope.data.address = data.address;
      $scope.data.date = data.date;
      $scope.data.discount = data.discount;
      $scope.data.count = data.count;
      $scope.data.amount = data.total;
      $scope.data.paymenttype = data.paymenttype;
      $scope.data.paid = data.paid;
      // $scope.data.total = tot;
      // console.log("total is ",tot)

      console.log("scope data fdgfdgkljfdkg",$scope.data)
      });
      console.log(res.data);
      
    });
    console.log("bill created");
    })
    $("#basicExampleModal").modal("show")
    }
  }
  $scope.printDiv = function() {
    var printContents = document.getElementById("invoicedata").innerHTML;
    // var originalContents = document.body.innerHTML;

    // document.body.innerHTML = printContents;

    // window.print();

    var popupWinindow = window.open('', '_blank', 'toolbar=no,location=no,status=no,titlebar=no,date=no');
    popupWinindow.document.open();
    popupWinindow.document.write('<html><head></head><body onload="window.print()">' + printContents + '</body></html>');
    popupWinindow.document.close();

    // document.body.innerHTML = originalContents;
  }

});

app.controller("viewinvoiceController",function($scope,$http){
  
  $scope.tot=0;
  $scope.items;
  $scope.data = {};
  $http.post("./php/viewinvoice.php",{}).then((res)=>{
    $scope.items = res.data;
    console.log( "items",$scope.items);
  });
  $scope.show = function(id,customer,address,date,count,amount,discount,paymenttype,paid){
    console.log(id);
    $http.post("./php/invoice.php",{id:id})
    .then((res)=>{
      tot = 0
      $scope.data.order = res.data;
      for(d in $scope.data.order)
      {
        tot += ((100-$scope.data.order[d]['discount'])*$scope.data.order[d]['quantity']*$scope.data.order[d]['rate'])/100
      }
      console.log("data",$scope.data.order)
      $scope.data.id = id;
      $scope.data.customer = customer;
      $scope.data.address = address;
      $scope.data.date = date;
      $scope.data.discount = discount;
      $scope.data.count = count;
      $scope.data.amount = amount;
      $scope.data.paymenttype = paymenttype;
      $scope.data.paid = paid;
      $scope.data.total = tot;
      console.log("total is ",tot)

      console.log($scope.data)
    });
  }
  $scope.printDiv = function() {
    var printContents = document.getElementById("invoicedata").innerHTML;

    var popupWinindow = window.open('', '_blank', 'toolbar=no,location=no,status=no,titlebar=no,date=no');
    popupWinindow.document.open();
    popupWinindow.document.write('<html><head></head><body onload="window.print()">' + printContents + '</body></html>');
    popupWinindow.document.close();

}
  
});
app.controller("createbarcodeController",function($scope,$http){
    
    // dropdown list
    $scope.sizes = ["65L", "84L"];
    // dropdown list
  
   // autofill  code
   $scope.dropdown = false;
   // Fetch data
   $scope.fetchUsers = function(){
                 
     var searchText_len = $scope.productCode.trim().length;
 
     // Check search text length
     if(searchText_len > 0){
        $http({
          method: 'POST',
          url: './php/getDataByCode.php',
          data: {searchText:$scope.productCode}
        }).then(function successCallback(response) {
          if (Object.keys(response.data).length > 0) {
            $scope.dropdown = true;
            $scope.searchResult = response.data;
           } else {
            $scope.dropdown = false;
            $scope.searchResult = {};
           } 
        });
     }else{
       $scope.dropdown = false;
        $scope.searchResult = {};
     }
               
  }
 
  // Set value to search box
  $scope.setValue = function(index,$event){
     $scope.productCode = $scope.searchResult[index].name;
     $scope.searchResult = {};
     $event.stopPropagation();
     $scope.dropdown = false;
  }
 
  $scope.searchboxClicked = function($event){
     $event.stopPropagation();
     $scope.dropdown = false;
  }
 
  $scope.containerClicked = function(){
     $scope.searchResult = {};
     $scope.dropdown = false;
  }
   // autofill code
 
   $scope.alertType = false;
   let code ="";
   let stock = "";
   
   $scope.validateproduct = function(){
     let data = {productCode:$scope.productCode};
     $http.post("./php/validateproduct.php",data)
     .then(function(res){
       console.log(typeof(res.data));
       if (typeof(res.data)=='object') {
         $scope.productName = res.data.productname;
       $scope.productRate = res.data.productrate;
       $scope.productStock = res.data.productstock;
       $scope.productUnit= res.data.productunit;
       code =res.data.productcode;
       stock = parseInt(res.data.productstock);
       } else {
         $scope.alertType = true;
         $scope.alertmsg = res.data;
       }
     })
   }
});

app.controller("pendingInvoicesController",function($scope,$http){
  $scope.items;
  $http.post("./php/pendingbills.php",{}).then((res)=>{
    $scope.items = res.data;
    console.log( "items",$scope.items);
  });

  $scope.show = function(amount,paid,pendingAmount,id){
    $scope.pendingTotal = amount;
    $scope.pendingPaid = paid;
    $scope.pendingAmount = pendingAmount;
    $scope.pendingbillid = id;
  } 

  $scope.pay = function(){
    if($scope.pendingCurrentPayment > ($scope.pendingTotal - $scope.pendingPaid))
    {
      $scope.alertType = true;
      $scope.alertmsg = "Current payment cannot be more than ",$scope.pendingTotal - $scope.pendingPaid; 
      return;
    }
    data = {
      payingAmount:parseInt($scope.pendingCurrentPayment)+parseInt($scope.pendingPaid),
      id:$scope.pendingbillid
    }
    console.log("paying amount",data.payingAmount,typeof data.payingAmount)
    $http.post("./php/pendingbillupdate.php",data).then((res)=>{
      $scope.alertType = true;
      $scope.alertmsg = res.data;
      $scope.pendingTotal = 
      $scope.pendingPaid = 
      $scope.pendingAmount = 
      $scope.pendingCurrentPayment = 0;
    });
  }
});

app.controller("deleteProductsController",function($scope,$http){
  $http.get("./php/fetchProduct.php").then(function(res){
    $scope.products = res.data;
  });

  $scope.delete = function(id,name){
    $("#deleteModal").modal("show");
    $scope.id = id;
    $scope.name = name;
  }

  $scope.deleteProduct = function () {
    data = {
      id:$scope.id
    }
    $http.post("./php/deleteproduct.php",data).then(function(res){
      $("#deleteModal").modal("hide");
      $scope.alertType = true;
      $scope.alertmsg = res.data;
    });
  }
});