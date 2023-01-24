import React, { Component } from "react";
import axios from "axios";

import classnames from "classnames";
import Loading from "./Loading";
import Panel from "./Panel";
import { getTotalInterviews, getLeastPopularTimeSlot, getMostPopularDay, getInterviewsPerDay } from "helpers/selectors";
import { setInterview } from "helpers/reducers";

//------------------------------------------
// Mock Data
// const data = [
//   {
//     id: 1,
//     label: "Total Interviews",
//     value: 6
//   },
//   {
//     id: 2,
//     label: "Least Popular Time Slot",
//     value: "1pm"
//   },
//   {
//     id: 3,
//     label: "Most Popular Day",
//     value: "Wednesday"
//   },
//   {
//     id: 4,
//     label: "Interviews Per Day",
//     value: "2.3"
//   }
// ];
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];
//------------------------------------------

class Dashboard extends Component {

  // Bind through constructor --> Option 4
  constructor(props) {
    super(props);
      this.selectPanel = this.selectPanel.bind(this);
  }

  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {}
  };

  // More options see: https://flex-web.compass.lighthouselabs.ca/workbooks/flex-m08w21/activities/1310?journey_step=62
    // Arrow function so no ".bind(this)" needed --> option 2
    selectPanel = (id) => {
      // Alternative to previousState
      // this.state.focused === null ? 
      // this.setState({focused: id}) : this.setState({focused: null})
      this.setState(previousState => ({
        focused: previousState.focused !== null ? null : id
      }));
    };

    // Need to use .bind(this) when called --> option 1 & 3
    // selectPanel(id) {
    //   this.state.focused === null ? 
    //   this.setState({focused: id}) : this.setState({focused: null})
    // };

    componentDidMount() {

      const focused = JSON.parse(localStorage.getItem("focused"));

      if (focused) {
        this.setState({ focused });
      }

      Promise.all([
        axios.get("/api/days"),
        axios.get("/api/appointments"),
        axios.get("/api/interviewers")
      ]).then(([days, appointments, interviewers]) => {
        this.setState({
          loading: false,
          days: days.data,
          appointments: appointments.data,
          interviewers: interviewers.data
        });
      })
      this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

      this.socket.onmessage = event => {
        const data = JSON.parse(event.data);
      
        if (typeof data === "object" && data.type === "SET_INTERVIEW") {
          this.setState(previousState =>
            setInterview(previousState, data.id, data.interview)
          );
        }
      };
    }

  
    componentDidUpdate(previousProps, previousState) {
      if (previousState.focused !== this.state.focused) {
        localStorage.setItem("focused", JSON.stringify(this.state.focused));
      }
    }

    componentWillUnmount() {
      this.socket.close();
    }
  

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
    });

    if (this.state.loading) {
      return <Loading />;
    }

    console.log(this.state)

    const panels = (this.state.focused ? data.filter(panel => this.state.focused === panel.id) : data)
    .map(panel => (
      <Panel
        key={panel.id}
        id={panel.id}
        label={panel.label}
        value={panel.getValue(this.state)}
        // onSelect={this.selectPanel.bind(this)} /* --> option 1 */
        onSelect={this.selectPanel} /* --> option 2 & 4*/
        // onSelect={() => this.selectPanel(panel.id)} /* --> option 3 */
      />
    ));

    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;
