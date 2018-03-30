import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import $ from "jquery";
import orderapi from "../../api/user/ording.js";
import img from "../../assets/img/回锅肉.jpg";
import allMenu from "../../assets/menu.json";
import "./css/choosemenu.css";
class ChooseMenu extends Component {
  constructor(props){
  	super(props);
  	this.state = {
  		menu:allMenu,
      type:"metadishes",
      hasChoosed:{
        metadishes:[],
        cooking:[],
        vegetables:[],
        soup:[]
      }
  	}
  }
  componentWillMount(){
    var option = window.localStorage.getItem("hasChoosed");
    option = JSON.parse(option);
    console.log(option);
  }
  componentDIdMount(){
    var option = window.localStorage.getItem("hasChoosed");
    if(option == null){

    }
    else{
      option = JSON.parse(option);
      this.setState({
        hasChoosed:option
      })
    }
  }
  chooseMenuType(e){
    var type = $(e.target).data().type;
    
    if(type == undefined){

    }
    else{
      $(".menuhead div").css({
        backgroundColor:"white"
      })
      $(e.target).parent().css({
        backgroundColor:"rgba(0,143,215,1)"
      })
      this.setState({
        type:type
      })
    }
  }
  addMenu(e){
  	var uid = window.localStorage.getItem("uid");
    var type = $(e.target).data().type;
    var name = $(e.target).data().name;
    var price = $(e.target).data().price;
    var username = window.localStorage.getItem("name");
    var data = "type=" + type +"&name=" + name + "&price=" + price + "&uid=" + uid + "&user=" + username;
    orderapi.ording(data).then(res=>{
//  	alert(res.msg);
    })
  }
  render() {
    var that = this;
    var type = this.state.type;
    var allMenu = this.state.menu[type].menu;
    return (
      <div className="choosemenu">
      	
        <div className="menuhead" onClick={this.chooseMenuType.bind(this)}>
          <div className="metadishes menucommon">
            <span data-type="metadishes">荤菜类</span>
          </div>
          <div className="cooking menucommon">
            <span data-type="cooking">炒菜类</span>
          </div>
          <div className="vegetables menucommon">
            <span data-type="vegetables">素菜类</span>
          </div>
          <div className="soup menucommon">
            <span data-type="soup">汤类</span>
          </div>
        </div>
        <div className="menuInfo row">
            {
              allMenu.map(function(data,index){
               
                  return(
                    <div className="col-xs-6 col-sm-4 col-md-3 col-lg-2">
                      <img src={img} className="menuImg" alt={data.name} data-type={type} data-name={data.name} data-price={data.price} onClick={that.addMenu.bind(that)} />
                      <p>
                        <span>价格：<span className="price">{data.price}</span>元</span><br/>
                        <span>名称：{data.name}</span>
                      </p>
                    </div>
                  )
              })
            }
        </div>
      </div>
    );
  }
}

export default ChooseMenu;
