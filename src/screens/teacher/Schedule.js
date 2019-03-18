import React, { Fragment } from "react"
import {
	View,
	Text,
	TouchableHighlight,
	StyleSheet,
	TouchableOpacity
} from "react-native"
import { connect } from "react-redux"
import { strings, dates } from "../../i18n"
import { Agenda } from "react-native-calendars"
import Row from "../../components/Row"
import UserWithPic from "../../components/UserWithPic"
import { Icon } from "react-native-elements"
import Separator from "../../components/Separator"
import { calendarTheme, MAIN_PADDING } from "../../consts"
import Hours from "../../components/Hours"
import { getDateAndString } from "../../actions/lessons"
import LessonPopup from "../../components/LessonPopup"
import EmptyState from "../../components/EmptyState"

export class Schedule extends React.Component {
	static navigationOptions = () => {
		return {
			title: "schedule",
			tabBarLabel: strings("tabs.schedule"),
			tabBarAccessibilityLabel: strings("tabs.schedule"),
			tabBarTestID: "ScheduleTab"
		}
	}
	constructor(props) {
		super(props)
		const date = new Date()
		this.state = {
			selected: date.toJSON().slice(0, 10),
			items: {},
			visible: []
		}
		this._getItems(date)
		this.onDayPress = this.onDayPress.bind(this)
	}

	_getItems = async date => {
		const dates = getDateAndString(date)
		const resp = await this.props.fetchService.fetch(
			"/lessons/?is_approved=true&date=ge:" +
				dates.date.startOf("day").toISOString() +
				"&date=le:" +
				dates.date.endOf("day").toISOString(),
			{ method: "GET" }
		)
		if (!resp.json["data"]) return
		this.setState(prevState => ({
			items: {
				...prevState.items,
				[dates.dateString]: resp.json["data"]
			}
		}))
	}
	lessonPress = item => {
		let newVisible
		if (this.state.visible.includes(item.id)) {
			// we pop it
			newVisible = this.state.visible.filter((v, i) => v != item.id)
		} else {
			newVisible = [...this.state.visible, item.id]
		}
		this.setState({ visible: newVisible })
	}

	renderItem = (item, firstItemInDay) => {
		let style = {}
		if (firstItemInDay) {
			style = { marginTop: 20 }
		}
		const date = item.date
		let meetup = strings("not_set")
		if (item.meetup_place) meetup = item.meetup_place.name
		let dropoff = strings("not_set")
		if (item.dropoff_place) dropoff = item.dropoff_place.name
		const visible = this.state.visible.includes(item.id) ? true : false
		return (
			<Fragment>
				<TouchableOpacity onPress={() => this.lessonPress(item)}>
					<Row
						style={{ ...styles.row, ...style }}
						leftSide={
							<Hours duration={item.duration} date={date} />
						}
					>
						<UserWithPic
							name={`${item.student.user.name}(${
								item.lesson_number
							})`}
							imageContainerStyle={styles.imageContainerStyle}
							extra={
								<Fragment>
									<Text style={styles.places}>
										{strings("teacher.new_lesson.meetup")}:{" "}
										{meetup}
									</Text>
									<Text style={styles.places}>
										{strings("teacher.new_lesson.dropoff")}:{" "}
										{dropoff}
									</Text>
								</Fragment>
							}
							nameStyle={styles.nameStyle}
							width={44}
							height={44}
							style={styles.userWithPic}
						/>
					</Row>
				</TouchableOpacity>
				<LessonPopup
					visible={visible}
					item={item}
					onPress={this.lessonPress}
					navigation={this.props.navigation}
				/>
			</Fragment>
		)
	}

	renderKnob = () => {
		return (
			<View>
				<TouchableHighlight>
					<View>
						<Icon
							size={20}
							color="rgb(12, 116, 244)"
							name="add-circle"
							type="material"
						/>
						<Text style={styles.calendarText}>
							{strings("teacher.schedule.calendar")}
						</Text>
					</View>
				</TouchableHighlight>
				<Separator />
			</View>
		)
	}

	_renderEmpty = () => {
		return (
			<EmptyState
				image="lessons"
				text={strings("empty_lessons")}
				style={styles.empty}
			/>
		)
	}

	onDayPress = day => {
		this.setState(
			{
				selected: day.dateString
			},
			() => {
				this._getItems(day)
			}
		)
	}
	render() {
		return (
			<View style={styles.container}>
				<View testID="ScheduleView" style={styles.schedule}>
					<Agenda
						items={this.state.items}
						// callback that gets called on day press
						onDayPress={this.onDayPress}
						// initially selected day
						selected={Date()}
						// Max amount of months allowed to scroll to the past. Default = 50
						pastScrollRange={50}
						// Max amount of months allowed to scroll to the future. Default = 50
						futureScrollRange={50}
						// specify how each item should be rendered in agenda
						renderItem={this.renderItem}
						// specify how each date should be rendered. day can be undefined if the item is not first in that day.
						renderDay={(day, item) => undefined}
						renderEmptyDate={this._renderEmpty}
						// specify your item comparison function for increased performance
						rowHasChanged={(r1, r2) => {
							return r1.text !== r2.text || this.state.visible
						}}
						markedDates={{
							[this.state.selected]: {
								selected: true
							}
						}}
						showOnlyDaySelected={true}
						// agenda theme
						theme={{
							...calendarTheme,
							backgroundColor: "transparent",
							agendaKnobColor: "gray",
							textWeekDayFontSize: 16,
							textWeekDayFontWeight: "600"
						}}
						ItemSeparatorComponent={() => <Separator />}
						extraData={this.state.visible}
					/>
				</View>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	calendar: {
		flex: 1
	},
	header: {
		flex: 1,
		alignItems: "center",
		maxHeight: 100
	},
	calendarText: {
		fontWeight: "bold",
		color: "rgb(12,116,244)",
		marginTop: 6
	},
	schedule: {
		flex: 1,
		paddingRight: MAIN_PADDING,
		paddingLeft: MAIN_PADDING,
		marginTop: 20
	},
	row: {},
	imageContainerStyle: { marginTop: 10 },
	places: {
		fontSize: 14,
		color: "gray",
		marginTop: 4,
		alignSelf: "flex-start"
	},
	nameStyle: {
		marginTop: -4
	},
	hour: {
		fontSize: 20,
		color: "gray",
		marginTop: -12
	},
	userWithPic: { marginLeft: 10 },
	empty: {
		marginTop: 100
	}
})

function mapStateToProps(state) {
	return {
		fetchService: state.fetchService
	}
}
export default connect(mapStateToProps)(Schedule)