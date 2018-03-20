import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link} from "react-router-dom";
import "./css/hadChoose.css";
import {Redirect} from "react-router-dom";
class HadChoose extends Component {
  constructor(props){
  	super(props);
  	this.state = {
      hadChoose:{
        metadishes:[],
        cooking:[],
        vegetables:[],
        soup:[]
      },
      hadState:false,
      type:[
        {
          type:"metadishes",
          typeClass:"荤菜类"
        },
        {
          type:"cooking",
          typeClass:"炒菜类"
        },
        {
          type:"vegetables",
          typeClass:"青菜类"
        },
        {
          type:"soup",
          typeClass:"汤类"
        }
      ]
  	}
  }
  componentWillMount(){
  }
  componentDidMount(){
    var option = window.localStorage.getItem("hasChoosed");
    if(option == null){

    }
    else{
      option = JSON.parse(option);
      this.setState({
        hadChoose:option,
        hadState:true
      })
    }
    
  }
  componentDidUpdate(){
		console.log("更新");
		console.log(this.props.params);
	}
  render(){
    var that = this;
    return (
      <div className="hadChoose">
      {
        this.state.type.map(function(data,index){
          var clas = data.type;
          return (
            <div className="hadchooseInfo col-xs-12 col-sm-12 col-md-6 col-lg-6" key={data.type}>
              <h4>{data.typeClass}</h4>
              {
                that.state.hadChoose[data.type].map(function(data){
                  return (
                    <span>{data.name}</span>
                  )
                })
              }
            </div>
            )
        })
      }
        
      </div>
      )
  }
}

export default HadChoose;
