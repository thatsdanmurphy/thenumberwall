import { useState, useEffect, useRef } from "react";

// ── FONT CONSTANTS ────────────────────────────────────────────
const MONUMENT = "'Barlow Condensed',Impact,sans-serif";
const MONO     = "'Space Mono','Courier New',monospace";
const ACCENT   = "'Playfair Display',Georgia,serif";

// ── SPORTS ───────────────────────────────────────────────────
const SPORTS = ["ALL","Hockey","Basketball","Football","Baseball","Soccer"];
const SPORT_FILTER_MAP = {
  "Hockey":     ["NHL","Hockey","PWHL"],
  "Basketball": ["NBA","Basketball","WNBA"],
  "Football":   ["NFL","Football"],
  "Baseball":   ["MLB","Baseball"],
  "Soccer":     ["Soccer"],
};

// ── TIER SYSTEM ──────────────────────────────────────────────
const TIER     = { SACRED:"SACRED", LEGEND:"LEGEND", RISING:"RISING", UNWRITTEN:"UNWRITTEN" };
const tierHeat = { SACRED:10, LEGEND:8, RISING:5, UNWRITTEN:1 };

// ── SHEET ────────────────────────────────────────────────────
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=0&single=true&output=csv";

// ── STATIC FALLBACK DATA ───────────────────────────────────────────────────
const GLOBAL_WALL_STATIC = [
  {"Number":"1","Tier":"LEGEND","Name":"Oscar Robertson","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Golden Era","Team":"Milwaukee Bucks","Signature Stat":"181","Stat Label":"Career Triple-Doubles","Stat Weight":"3","Role":"Point Guard","Fun Fact":"He averaged a triple-double for an entire season in 1961-62 - a feat so absurd it took 55 years for anyone to do it again","Notes":""},
  {"Number":"1","Tier":"LEGEND","Name":"Terry Sawchuk","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Original Six","Team":"Detroit Red Wings","Signature Stat":"103","Stat Label":"Career Shutouts","Stat Weight":"3","Role":"Goaltender","Fun Fact":"He recorded 103 shutouts - a record that still stands today - and played through injuries that would have ended anyone else's career","Notes":""},
  {"Number":"1","Tier":"RISING","Name":"Victor Wembanyama","Sport":"Basketball","League":"NBA","Status":"Active","Era":"NBA Now","Team":"San Antonio Spurs","Signature Stat":"2023","Stat Label":"#1 Draft Pick","Stat Weight":"3","Role":"Center","Fun Fact":"He's 7-foot-4 with guard skills and a 8-foot wingspan - NBA coaches said they had never seen anything like him before he played a single game","Notes":"RISING - review annually"},
  {"Number":"1","Tier":"LEGEND","Name":"Warren Moon","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern Era","Team":"Houston Oilers","Signature Stat":"49117","Stat Label":"Career Passing Yards","Stat Weight":"2","Role":"Quarterback","Fun Fact":"He was passed over by every NFL team in 1978 because of his race - spent 6 years dominating the CFL before the NFL finally came calling","Notes":""},
  {"Number":"2","Tier":"LEGEND","Name":"Brian Leetch","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"New York Rangers","Signature Stat":"1028","Stat Label":"Career Points","Stat Weight":"2","Role":"Defenseman","Fun Fact":"He won the Conn Smythe in 1994 as a defenseman - only the third D-man ever to win playoff MVP - and ended the Rangers' 54-year Cup drought","Notes":""},
  {"Number":"2","Tier":"LEGEND","Name":"Derek Jeter","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Yankees Dynasty","Team":"New York Yankees","Signature Stat":"3465","Stat Label":"Career Hits","Stat Weight":"3","Role":"Shortstop","Fun Fact":"He made The Flip - a relay throw nobody should have been near - to nail Jeremy Giambi at the plate and save a playoff series","Notes":""},
  {"Number":"3","Tier":"LEGEND","Name":"Allen Iverson","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"Philadelphia 76ers","Signature Stat":"31.1","Stat Label":"Peak Season PPG","Stat Weight":"3","Role":"Point Guard","Fun Fact":"He was 6 feet tall and 165 pounds and led the NBA in scoring four times - the Answer proved size didn't matter if your heart was big enough","Notes":""},
  {"Number":"3","Tier":"LEGEND","Name":"Babe Ruth","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Baseball Golden Age","Team":"New York Yankees","Signature Stat":"714","Stat Label":"Career Home Runs","Stat Weight":"3","Role":"Right Field","Fun Fact":"He was such a dominant pitcher that the Yankees converted him to an outfielder just so he could hit every day - and he became the greatest power hitter who ever lived","Notes":"#3 retired by Yankees"},
  {"Number":"3","Tier":"LEGEND","Name":"Dwyane Wade","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"Miami Heat","Signature Stat":"3","Stat Label":"Championships","Stat Weight":"2","Role":"Shooting Guard","Fun Fact":"In the 2006 Finals he averaged 34.7 points and single-handedly willed the Heat back from 2-0 down to win the championship","Notes":""},
  {"Number":"4","Tier":"LEGEND","Name":"Bobby Orr","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Dynasty","Team":"Boston Bruins","Signature Stat":"102","Stat Label":"Career Goals (D record)","Stat Weight":"3","Role":"Defenseman","Fun Fact":"He flew through the air with his arms out after scoring the 1970 Cup winner - the most iconic image in hockey history","Notes":""},
  {"Number":"4","Tier":"LEGEND","Name":"Lou Gehrig","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Baseball Golden Age","Team":"New York Yankees","Signature Stat":"493","Stat Label":"Career Home Runs","Stat Weight":"3","Role":"First Base","Fun Fact":"He played 2,130 consecutive games - and when ALS finally forced him to stop he stood at home plate and called himself the luckiest man on the face of the earth","Notes":""},
  {"Number":"5","Tier":"RISING","Name":"Anthony Edwards","Sport":"Basketball","League":"NBA","Status":"Active","Era":"NBA Now","Team":"Minnesota Timberwolves","Signature Stat":"25.9","Stat Label":"PPG 2023-24","Stat Weight":"3","Role":"Shooting Guard","Fun Fact":"He plays every game like he's having the time of his life - and he might already be the second-best player in the NBA","Notes":"RISING - review annually"},
  {"Number":"5","Tier":"LEGEND","Name":"Joe DiMaggio","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Baseball Golden Age","Team":"New York Yankees","Signature Stat":"56","Stat Label":"Consecutive Game Hit Streak","Stat Weight":"3","Role":"Center Field","Fun Fact":"He hit in 56 consecutive games in 1941 - a record so untouchable that statisticians say it's the most unlikely sports achievement in history","Notes":""},
  {"Number":"5","Tier":"LEGEND","Name":"Nicklas Lidstrom","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"Detroit Red Wings","Signature Stat":"7","Stat Label":"Norris Trophies","Stat Weight":"3","Role":"Defenseman","Fun Fact":"He won seven Norris Trophies as the best defenseman in hockey - a standard of excellence over 20 years that may never be matched","Notes":""},
  {"Number":"6","Tier":"SACRED","Name":"Bill Russell","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Dynasty","Team":"Boston Celtics","Signature Stat":"11","Stat Label":"Championships","Stat Weight":"3","Role":"Center","Fun Fact":"The NBA retired his number across all 30 teams in 2022 - 55 years after his last championship - because some legacies take time to fully understand","Notes":"SACRED"},
  {"Number":"7","Tier":"LEGEND","Name":"Mickey Mantle","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Baseball Golden Age","Team":"New York Yankees","Signature Stat":"536","Stat Label":"Career Home Runs","Stat Weight":"3","Role":"Center Field","Fun Fact":"He hit the longest measured home run in history - 565 feet - at 21 years old - and did it on knees that should have ended his career a decade earlier","Notes":""},
  {"Number":"7","Tier":"LEGEND","Name":"Phil Esposito","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Dynasty","Team":"Boston Bruins","Signature Stat":"459","Stat Label":"Goals as a Bruin","Stat Weight":"2","Role":"Center","Fun Fact":"He was the first player in NHL history to score 100 points in a season - in 1968-69 - and he did it so comfortably that everyone knew the game had changed","Notes":""},
  {"Number":"7","Tier":"RISING","Name":"Shai Gilgeous-Alexander","Sport":"Basketball","League":"NBA","Status":"Active","Era":"NBA Now","Team":"Oklahoma City Thunder","Signature Stat":"30.1","Stat Label":"PPG 2023-24","Stat Weight":"3","Role":"Point Guard","Fun Fact":"He became the most efficient elite scorer in the NBA - averaging 30 points on 53% shooting - the quietest superstar in the league","Notes":"RISING - review annually"},
  {"Number":"8","Tier":"LEGEND","Name":"Alex Ovechkin","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"Washington Capitals","Signature Stat":"894","Stat Label":"Career Goals","Stat Weight":"3","Role":"Left Wing","Fun Fact":"He passed Wayne Gretzky's all-time goals record in 2024 - the record everyone said was untouchable - and celebrated like he'd been waiting his whole life","Notes":""},
  {"Number":"8","Tier":"LEGEND","Name":"Cal Ripken Jr.","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"Baltimore Orioles","Signature Stat":"2632","Stat Label":"Consecutive Games Played","Stat Weight":"3","Role":"Shortstop","Fun Fact":"He played 2,632 consecutive games - breaking Gehrig's record that everyone said was untouchable - and did it as a shortstop, not a DH","Notes":""},
  {"Number":"8","Tier":"RISING","Name":"Cale Makar","Sport":"Hockey","League":"NHL","Status":"Active","Era":"NHL Now","Team":"Colorado Avalanche","Signature Stat":"93","Stat Label":"Points 2021-22","Stat Weight":"3","Role":"Defenseman","Fun Fact":"He won the Norris, Conn Smythe, and Stanley Cup in the same season at age 23 - one of the greatest seasons a defenseman has ever played","Notes":"RISING - review annually"},
  {"Number":"8","Tier":"LEGEND","Name":"Kobe Bryant","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"Los Angeles Lakers","Signature Stat":"5","Stat Label":"Championships","Stat Weight":"3","Role":"Shooting Guard","Fun Fact":"He wore both #8 and #24 - both retired by the Lakers - the only player in NBA history with two retired numbers at the same franchise","Notes":"Both 8 and 24 retired by Lakers"},
  {"Number":"9","Tier":"RISING","Name":"Erling Haaland","Sport":"Soccer","League":"Soccer","Status":"Active","Era":"Soccer Now","Team":"Manchester City","Signature Stat":"36","Stat Label":"Premier League Goals in a Season","Stat Weight":"3","Role":"Striker","Fun Fact":"He scored 36 Premier League goals in his first season in England - breaking the all-time record by a massive margin","Notes":"RISING - review annually"},
  {"Number":"9","Tier":"LEGEND","Name":"Gordie Howe","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Original Six","Team":"Detroit Red Wings","Signature Stat":"801","Stat Label":"Career Goals","Stat Weight":"3","Role":"Right Wing","Fun Fact":"The Gordie Howe Hat Trick is a goal, an assist, and a fight in one game - named for him because he did it so often it became its own category","Notes":""},
  {"Number":"9","Tier":"LEGEND","Name":"Maurice Richard","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Original Six","Team":"Montreal Canadiens","Signature Stat":"544","Stat Label":"Career Goals","Stat Weight":"2","Role":"Right Wing","Fun Fact":"When the NHL suspended him in 1955, Montreal fans rioted in the streets - the Richard Riot showed what he meant to an entire people","Notes":""},
  {"Number":"9","Tier":"LEGEND","Name":"Ted Williams","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Baseball Golden Age","Team":"Boston Red Sox","Signature Stat":"0.406","Stat Label":"Season Batting AVG","Stat Weight":"3","Role":"Left Field","Fun Fact":"He hit .406 in 1941 and nobody has done it since - and he lost five prime years to two military tours and came back and was still the best hitter alive","Notes":""},
  {"Number":"10","Tier":"RISING","Name":"Auston Matthews","Sport":"Hockey","League":"NHL","Status":"Active","Era":"NHL Now","Team":"Toronto Maple Leafs","Signature Stat":"69","Stat Label":"Goals in 2023-24","Stat Weight":"3","Role":"Center","Fun Fact":"He scored 69 goals in 2023-24 - the most in the NHL since the 1990s - and did it with a shot so fast goalies can barely react","Notes":"RISING - review annually"},
  {"Number":"10","Tier":"LEGEND","Name":"Guy Lafleur","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Dynasty","Team":"Montreal Canadiens","Signature Stat":"560","Stat Label":"Career Goals","Stat Weight":"2","Role":"Right Wing","Fun Fact":"He used to drive to the rink before dawn just to skate alone - that obsession drove five consecutive Stanley Cups","Notes":""},
  {"Number":"10","Tier":"LEGEND","Name":"Pelé","Sport":"Soccer","League":"Soccer","Status":"Retired","Era":"Soccer Golden Age","Team":"Santos FC","Signature Stat":"77","Stat Label":"Goals in World Cup","Stat Weight":"3","Role":"Forward","Fun Fact":"He won three World Cups - at 17, 22, and 29 - across three different decades - and scored over 1,000 career goals in professional football","Notes":""},
  {"Number":"10","Tier":"LEGEND","Name":"Steve Nash","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"Phoenix Suns","Signature Stat":"50.4","Stat Label":"True Shooting % career","Stat Weight":"3","Role":"Point Guard","Fun Fact":"He won back-to-back MVPs without a single All-NBA defensive team - proving a point guard could win the award on pure offensive brilliance alone","Notes":""},
  {"Number":"11","Tier":"LEGEND","Name":"Isiah Thomas","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Bad Boys","Team":"Detroit Pistons","Signature Stat":"27.6","Stat Label":"1988 Finals PPG","Stat Weight":"2","Role":"Point Guard","Fun Fact":"In the 1988 Finals he scored 25 points in one quarter on a badly sprained ankle - hobbling up and down the court - one of the great performances in Finals history","Notes":""},
  {"Number":"11","Tier":"LEGEND","Name":"Mark Messier","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Dynasty","Team":"Edmonton Oilers","Signature Stat":"694","Stat Label":"Career Goals","Stat Weight":"3","Role":"Center","Fun Fact":"He guaranteed a win in Game 6 of the 1994 ECF when the Rangers were down 3-2 - and then scored a hat trick - the greatest guarantee in hockey history","Notes":"#11 retired by Rangers and Oilers"},
  {"Number":"11","Tier":"RISING","Name":"Mohamed Salah","Sport":"Soccer","League":"Soccer","Status":"Active","Era":"Soccer Now","Team":"Liverpool FC","Signature Stat":"32","Stat Label":"Premier League Goals 2017-18","Stat Weight":"3","Role":"Right Wing","Fun Fact":"He scored 32 Premier League goals in 2017-18 - breaking the record for a 38-game season - and has been Liverpool's best player for seven straight years","Notes":"RISING - review annually"},
  {"Number":"12","Tier":"LEGEND","Name":"Joe Namath","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL AFL Era","Team":"New York Jets","Signature Stat":"27413","Stat Label":"Career Passing Yards","Stat Weight":"3","Role":"Quarterback","Fun Fact":"He guaranteed Super Bowl III victory as a 17-point underdog - and then won it - the most famous guarantee in sports history and the moment the AFL became real","Notes":""},
  {"Number":"12","Tier":"LEGEND","Name":"John Stockton","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"Utah Jazz","Signature Stat":"15806","Stat Label":"Career Assists","Stat Weight":"3","Role":"Point Guard","Fun Fact":"He has 5,000 more career assists than the second-best passer in NBA history - a gap so large it may never be closed","Notes":""},
  {"Number":"13","Tier":"LEGEND","Name":"Dan Marino","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Miami Dolphins","Signature Stat":"61361","Stat Label":"Career Passing Yards","Stat Weight":"3","Role":"Quarterback","Fun Fact":"He set the single-season passing record in 1984 with 5,084 yards - it stood for 27 years - and he never won a Super Bowl which makes him the greatest what-if in NFL history","Notes":"#13 retired by Dolphins"},
  {"Number":"13","Tier":"LEGEND","Name":"Wilt Chamberlain","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Golden Age","Team":"Philadelphia Warriors","Signature Stat":"100","Stat Label":"Points in single game","Stat Weight":"3","Role":"Center","Fun Fact":"He scored 100 points in a single NBA game in 1962 - a record so far beyond anyone else that it seems fictional - and averaged 50 points per game that entire season","Notes":""},
  {"Number":"14","Tier":"LEGEND","Name":"Brendan Shanahan","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"Detroit Red Wings","Signature Stat":"656","Stat Label":"Career Goals","Stat Weight":"2","Role":"Right Wing","Fun Fact":"He scored 656 goals and dropped the gloves more than almost anyone - a Hall of Famer who combined skill and toughness in a way nobody else did","Notes":""},
  {"Number":"14","Tier":"LEGEND","Name":"Pete Rose","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"Cincinnati Reds","Signature Stat":"4256","Stat Label":"Career Hits","Stat Weight":"3","Role":"Third Base/Outfield","Fun Fact":"He has 4,256 career hits - 130 more than the second all-time - and he's not in the Hall of Fame because of gambling - the most complicated legacy in baseball","Notes":"Gambling ban complicates but doesn't erase the stats"},
  {"Number":"15","Tier":"LEGEND","Name":"Nikola Jokic","Sport":"Basketball","League":"NBA","Status":"Active","Era":"NBA Modern","Team":"Denver Nuggets","Signature Stat":"3","Stat Label":"MVPs","Stat Weight":"3","Role":"Center","Fun Fact":"He's a 6-foot-11 center who makes passes only point guards are supposed to make - three MVPs and a championship make him the most unique dominant player in NBA history","Notes":"Active but passes Legend test - per tier list"},
  {"Number":"15","Tier":"LEGEND","Name":"Thurman Munson","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Yankees Dynasty","Team":"New York Yankees","Signature Stat":"1558","Stat Label":"Career Hits","Stat Weight":"2","Role":"Catcher","Fun Fact":"He died in a plane crash in 1979 at 32 - the Yankees retired his number immediately - the most beloved Yankee of the 1970s dynasty","Notes":"#15 retired by Yankees"},
  {"Number":"16","Tier":"LEGEND","Name":"Joe Montana","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Dynasty","Team":"San Francisco 49ers","Signature Stat":"4","Stat Label":"Super Bowl Wins","Stat Weight":"3","Role":"Quarterback","Fun Fact":"He was 3-for-3 in Super Bowl situations that required a game-winning drive - never threw an interception in four Super Bowls - Cool Joe never flinched","Notes":""},
  {"Number":"17","Tier":"LEGEND","Name":"Reggie Jackson","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Yankees Dynasty","Team":"New York Yankees","Signature Stat":"563","Stat Label":"Career Home Runs","Stat Weight":"3","Role":"Right Field","Fun Fact":"He hit three consecutive home runs on three consecutive pitches from three different pitchers in Game 6 of the 1977 World Series - the most theatrical performance in baseball history","Notes":""},
  {"Number":"17","Tier":"RISING","Name":"Shohei Ohtani","Sport":"Baseball","League":"MLB","Status":"Active","Era":"MLB Now","Team":"Los Angeles Dodgers","Signature Stat":"44","Stat Label":"Home Runs 2023","Stat Weight":"3","Role":"Pitcher/DH","Fun Fact":"He's the only player in the history of baseball to be an All-Star pitcher and a home run threat at the same time - Ruth is the only comparison and even that falls short","Notes":"RISING - review annually"},
  {"Number":"18","Tier":"LEGEND","Name":"Peyton Manning","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Indianapolis Colts","Signature Stat":"5477","Stat Label":"Peak Season Passing Yards","Stat Weight":"3","Role":"Quarterback","Fun Fact":"He set the single-season TD record with 55 in 2013 at age 37 - calling audibles at the line with surgical precision - the most cerebral QB who ever played","Notes":""},
  {"Number":"19","Tier":"LEGEND","Name":"Johnny Unitas","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Golden Age","Team":"Baltimore Colts","Signature Stat":"290","Stat Label":"Career Touchdowns","Stat Weight":"3","Role":"Quarterback","Fun Fact":"He threw a touchdown pass in 47 consecutive games - a record that stood for 52 years - and did it while wearing high-top black cleats that became the symbol of his era","Notes":""},
  {"Number":"19","Tier":"LEGEND","Name":"Steve Yzerman","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Dynasty","Team":"Detroit Red Wings","Signature Stat":"3","Stat Label":"Stanley Cups","Stat Weight":"3","Role":"Center","Fun Fact":"He waited 11 years to win his first Stanley Cup as Detroit's captain - and when he finally won it he skated around the ice alone with the Cup at 2am","Notes":"#19 retired by Red Wings"},
  {"Number":"19","Tier":"LEGEND","Name":"Tony Gwynn","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"San Diego Padres","Signature Stat":"0.338","Stat Label":"Career Batting AVG","Stat Weight":"2","Role":"Right Field","Fun Fact":"In the strike-shortened 1994 season he was hitting .394 when the season stopped - the closest anyone came to .400 since Ted Williams in 1941","Notes":"#19 retired by Padres"},
  {"Number":"20","Tier":"LEGEND","Name":"Barry Sanders","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Detroit Lions","Signature Stat":"15269","Stat Label":"Career Rushing Yards","Stat Weight":"3","Role":"Running Back","Fun Fact":"He retired at his peak with 15,269 rushing yards - 1,500 shy of the all-time record - because he didn't want to play for a bad team anymore - the most shocking retirement in NFL history","Notes":""},
  {"Number":"20","Tier":"LEGEND","Name":"Mike Schmidt","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"Philadelphia Phillies","Signature Stat":"548","Stat Label":"Career Home Runs","Stat Weight":"3","Role":"Third Base","Fun Fact":"He hit 548 home runs and won 10 Gold Gloves - the most complete third baseman in baseball history - and the Phillies' only World Series title came with him at third","Notes":""},
  {"Number":"21","Tier":"LEGEND","Name":"Roberto Clemente","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Civil Rights","Team":"Pittsburgh Pirates","Signature Stat":"3000","Stat Label":"Career Hits","Stat Weight":"3","Role":"Right Field","Fun Fact":"He died on New Year's Eve 1972 on a relief flight to earthquake victims in Nicaragua - the Hall of Fame waived the five-year waiting period and inducted him immediately","Notes":"#21 sacred at Pirates"},
  {"Number":"21","Tier":"LEGEND","Name":"Tim Duncan","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Dynasty","Team":"San Antonio Spurs","Signature Stat":"5","Stat Label":"Championships","Stat Weight":"3","Role":"Power Forward","Fun Fact":"He won five championships spanning three different decades - doing it quietly and fundamentally while everyone else chased flash - the greatest power forward ever","Notes":""},
  {"Number":"22","Tier":"LEGEND","Name":"Emmitt Smith","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Dynasty","Team":"Dallas Cowboys","Signature Stat":"18355","Stat Label":"Career Rushing Yards","Stat Weight":"3","Role":"Running Back","Fun Fact":"He is the all-time NFL rushing leader with 18,355 yards - and won three Super Bowls in the 1990s Cowboys dynasty while doing it","Notes":""},
  {"Number":"22","Tier":"LEGEND","Name":"Mike Bossy","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Dynasty","Team":"New York Islanders","Signature Stat":"573","Stat Label":"Career Goals","Stat Weight":"3","Role":"Right Wing","Fun Fact":"He scored 50 goals in 50 games in the 1980-81 season - matching Rocket Richard's legendary mark - and did it in his last game of that stretch with two goals in the final period","Notes":"#22 retired by Islanders"},
  {"Number":"23","Tier":"RISING","Name":"LeBron James","Sport":"Basketball","League":"NBA","Status":"Active","Era":"NBA Dynasty","Team":"Los Angeles Lakers","Signature Stat":"4","Stat Label":"Championships","Stat Weight":"3","Role":"Small Forward","Fun Fact":"He's the all-time NBA scoring leader and the only player ever granted an exception to wear a league-retired number - wearing Jordan's sacred #23","Notes":"The documented exception to the Sacred retirement"},
  {"Number":"23","Tier":"SACRED","Name":"Michael Jordan","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Dynasty","Team":"Chicago Bulls","Signature Stat":"6","Stat Label":"Championships","Stat Weight":"3","Role":"Shooting Guard","Fun Fact":"The NBA retired his number across all 30 franchises - then granted one exception for LeBron James - the only player deemed equivalent enough to wear it","Notes":"SACRED - LeBron is the documented exception"},
  {"Number":"24","Tier":"LEGEND","Name":"Kobe Bryant","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"Los Angeles Lakers","Signature Stat":"5","Stat Label":"Championships","Stat Weight":"3","Role":"Shooting Guard","Fun Fact":"He switched from #8 to #24 midcareer - a reset and rebirth - and both numbers were retired by the Lakers making him the only player in NBA history with two retired numbers at one franchise","Notes":""},
  {"Number":"24","Tier":"LEGEND","Name":"Rickey Henderson","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"Oakland Athletics","Signature Stat":"1406","Stat Label":"Career Stolen Bases","Stat Weight":"3","Role":"Left Field","Fun Fact":"He stole 1,406 bases - 468 more than the second all-time - and referred to himself in the third person as the greatest of all time which, honestly, he was","Notes":""},
  {"Number":"25","Tier":"LEGEND","Name":"Barry Bonds","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"San Francisco Giants","Signature Stat":"73","Stat Label":"Single Season Home Runs","Stat Weight":"3","Role":"Left Field","Fun Fact":"He hit 73 home runs in 2001 - the single-season record - and holds the all-time HR record with 762 - the most complicated legacy in baseball alongside Pete Rose","Notes":"PED era complicates but stats are undeniable"},
  {"Number":"26","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"27","Tier":"LEGEND","Name":"Vladimir Guerrero","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"Montreal Expos","Signature Stat":"449","Stat Label":"Career Home Runs","Stat Weight":"2","Role":"Right Field","Fun Fact":"He swung at balls a foot outside the strike zone and hit them for extra bases - the most dangerous bad-ball hitter in baseball history","Notes":""},
  {"Number":"28","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"29","Tier":"RISING","Name":"Marie-Philip Poulin","Sport":"Hockey","League":"PWHL","Status":"Active","Era":"PWHL Now","Team":"Montreal Victoire","Signature Stat":"6","Stat Label":"Olympic Gold Medals","Stat Weight":"3","Role":"Forward","Fun Fact":"She scored the gold medal winning goal in the 2010, 2014, and 2022 Olympics - three different Olympics, three times Canada needed a goal, three times she delivered","Notes":"RISING - equal weight to MacKinnon per tier list"},
  {"Number":"29","Tier":"LEGEND","Name":"Nathan MacKinnon","Sport":"Hockey","League":"NHL","Status":"Active","Era":"NHL Modern","Team":"Colorado Avalanche","Signature Stat":"140","Stat Label":"Points in 2022-23","Stat Weight":"3","Role":"Center","Fun Fact":"He has won multiple Hart Trophies and a Stanley Cup - widely considered the best player in the NHL - the most complete forward in the game today","Notes":"Active but passes Legend test per tier list"},
  {"Number":"30","Tier":"LEGEND","Name":"Martin Brodeur","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"New Jersey Devils","Signature Stat":"691","Stat Label":"Career Wins","Stat Weight":"3","Role":"Goaltender","Fun Fact":"He has 691 career wins - a record so far ahead of everyone else it's essentially untouchable - and won three Stanley Cups doing it","Notes":""},
  {"Number":"30","Tier":"LEGEND","Name":"Stephen Curry","Sport":"Basketball","League":"NBA","Status":"Active","Era":"NBA Modern","Team":"Golden State Warriors","Signature Stat":"4","Stat Label":"Championships","Stat Weight":"3","Role":"Point Guard","Fun Fact":"He single-handedly made the three-pointer the centerpiece of basketball offense - four championships and the unanimous MVP with the 73-win season","Notes":"Active but passes Legend test per tier list"},
  {"Number":"31","Tier":"LEGEND","Name":"Patrick Roy","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Dynasty","Team":"Montreal Canadiens","Signature Stat":"4","Stat Label":"Stanley Cups","Stat Weight":"3","Role":"Goaltender","Fun Fact":"He used to talk to his goalposts before games and demand a trade mid-game from the Montreal bench in front of 20,000 people - the most magnetic personality in hockey history","Notes":"#31 retired by Canadiens and Avalanche"},
  {"Number":"32","Tier":"LEGEND","Name":"Magic Johnson","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Showtime","Team":"Los Angeles Lakers","Signature Stat":"5","Stat Label":"Championships","Stat Weight":"3","Role":"Point Guard","Fun Fact":"He played center in the deciding game of his rookie Finals - a 6-foot-9 point guard starting at center and scoring 42 points - the performance that announced he was different","Notes":"#32 sacred at Lakers"},
  {"Number":"32","Tier":"LEGEND","Name":"Sandy Koufax","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Golden Age","Team":"Los Angeles Dodgers","Signature Stat":"0.95","Stat Label":"ERA in 1964","Stat Weight":"3","Role":"Pitcher","Fun Fact":"From 1963-1966 he was the most dominant pitcher in baseball history - four no-hitters including a perfect game - then he retired at 30 because his arm gave out","Notes":"#32 sacred at Dodgers"},
  {"Number":"33","Tier":"LEGEND","Name":"Larry Bird","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Dynasty","Team":"Boston Celtics","Signature Stat":"3","Stat Label":"Championships","Stat Weight":"3","Role":"Small Forward","Fun Fact":"He once told the other team exactly where he was going to shoot from and then did it - three MVPs and three championships next door to Magic's 32","Notes":"#33 sacred at Celtics"},
  {"Number":"33","Tier":"LEGEND","Name":"Patrick Ewing","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"New York Knicks","Signature Stat":"24815","Stat Label":"Career Points","Stat Weight":"2","Role":"Center","Fun Fact":"He carried the Knicks on his back for 15 seasons and never won a title - the greatest player to never win a ring alongside Barkley and Stockton","Notes":"#33 retired by Knicks"},
  {"Number":"34","Tier":"LEGEND","Name":"Shaquille O'Neal","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Dynasty","Team":"Los Angeles Lakers","Signature Stat":"4","Stat Label":"Championships","Stat Weight":"3","Role":"Center","Fun Fact":"He was so physically dominant in 2000-2002 that referees had to create new rules just to slow him down - three consecutive Finals MVPs","Notes":""},
  {"Number":"34","Tier":"LEGEND","Name":"Walter Payton","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Chicago Bears","Signature Stat":"16726","Stat Label":"Career Rushing Yards","Stat Weight":"3","Role":"Running Back","Fun Fact":"Sweetness - he ran with the grace of a dancer and the force of a freight train - the most complete running back in NFL history","Notes":"#34 sacred at Bears"},
  {"Number":"35","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"36","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"37","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"38","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"39","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"40","Tier":"LEGEND","Name":"Gale Sayers","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Golden Age","Team":"Chicago Bears","Signature Stat":"9435","Stat Label":"Career All-Purpose Yards","Stat Weight":"3","Role":"Running Back","Fun Fact":"He was inducted into the Hall of Fame at 34 - the youngest ever - after injuries cut his career short - Brian's Song made him known to a generation beyond football","Notes":"#40 sacred at Bears"},
  {"Number":"41","Tier":"LEGEND","Name":"Dirk Nowitzki","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"Dallas Mavericks","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"3","Role":"Power Forward","Fun Fact":"He was the first European player to win NBA MVP and invented the fadeaway one-legged jumper that every big in the world now tries to copy","Notes":""},
  {"Number":"41","Tier":"LEGEND","Name":"Tom Seaver","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"New York Mets","Signature Stat":"311","Stat Label":"Career Wins","Stat Weight":"2","Role":"Pitcher","Fun Fact":"He was so good the Mets named him Tom Terrific and built a championship around him - three Cy Youngs and the 1969 Miracle Mets","Notes":""},
  {"Number":"42","Tier":"SACRED","Name":"Jackie Robinson","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"Civil Rights","Team":"Brooklyn Dodgers","Signature Stat":"6","Stat Label":"Stolen Base Titles","Stat Weight":"3","Role":"Second Base","Fun Fact":"His number is retired across all of baseball - not one team, all of them - and every April 15th every player in baseball wears 42 because what he did was bigger than baseball","Notes":"SACRED - retired across all MLB"},
  {"Number":"43","Tier":"LEGEND","Name":"Troy Polamalu","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Pittsburgh Steelers","Signature Stat":"2","Stat Label":"Super Bowl Rings","Stat Weight":"2","Role":"Safety","Fun Fact":"He played with long flowing hair that flew behind him when he blitzed - a supernatural force at safety who seemed to know where the ball was going before the snap","Notes":""},
  {"Number":"44","Tier":"LEGEND","Name":"Hank Aaron","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Civil Rights","Team":"Atlanta Braves","Signature Stat":"755","Stat Label":"Career Home Runs","Stat Weight":"3","Role":"Right Field","Fun Fact":"He received death threats while chasing Babe Ruth's home run record in 1973 - and kept playing - and broke it on April 8, 1974 in front of a roaring crowd in Atlanta","Notes":"#44 retired by Braves"},
  {"Number":"44","Tier":"LEGEND","Name":"Jerry West","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Golden Age","Team":"Los Angeles Lakers","Signature Stat":"25192","Stat Label":"Career Points","Stat Weight":"2","Role":"Guard","Fun Fact":"His silhouette is the NBA logo - he doesn't just have his number retired, his image defines the entire sport","Notes":""},
  {"Number":"45","Tier":"LEGEND","Name":"Pedro Martinez","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"Boston Red Sox","Signature Stat":"2.93","Stat Label":"Career ERA","Stat Weight":"3","Role":"Pitcher","Fun Fact":"In 1999 and 2000 he was so far ahead of his era that his statistics look like a video game - the best two-year pitching run of the modern era","Notes":""},
  {"Number":"46","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"47","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"48","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"49","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"50","Tier":"LEGEND","Name":"David Robinson","Sport":"Basketball","League":"NBA","Status":"Retired","Era":"NBA Modern","Team":"San Antonio Spurs","Signature Stat":"2","Stat Label":"Championships","Stat Weight":"2","Role":"Center","Fun Fact":"He served in the US Navy for two years before joining the Spurs - The Admiral - and then drafted Tim Duncan which gave San Antonio two of the greatest PFs ever","Notes":""},
  {"Number":"51","Tier":"LEGEND","Name":"Randy Johnson","Sport":"Baseball","League":"MLB","Status":"Retired","Era":"MLB Modern","Team":"Arizona Diamondbacks","Signature Stat":"4875","Stat Label":"Career Strikeouts","Stat Weight":"3","Role":"Pitcher","Fun Fact":"The Big Unit was 6-foot-10 and threw 100mph - facing him was described by hitters as looking up at a skyscraper throwing lightning","Notes":""},
  {"Number":"52","Tier":"LEGEND","Name":"Ray Lewis","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Baltimore Ravens","Signature Stat":"2","Stat Label":"Super Bowl Rings","Stat Weight":"3","Role":"Linebacker","Fun Fact":"He danced before every game in a way that made opposing teams genuinely afraid - the most intimidating presence in NFL history - two Super Bowl rings","Notes":"#52 sacred at Ravens"},
  {"Number":"53","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"54","Tier":"LEGEND","Name":"Brian Urlacher","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Chicago Bears","Signature Stat":"41.5","Stat Label":"Career Sacks","Stat Weight":"2","Role":"Linebacker","Fun Fact":"He was the quarterback of the Bears defense for 13 years - the fastest linebacker in the NFL who could cover wide receivers and lay out running backs","Notes":""},
  {"Number":"55","Tier":"LEGEND","Name":"Junior Seau","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"San Diego Chargers","Signature Stat":"56.5","Stat Label":"Career Sacks","Stat Weight":"3","Role":"Linebacker","Fun Fact":"He played 20 seasons with relentless ferocity and died in 2012 - his CTE diagnosis helped change how the NFL treats player safety","Notes":""},
  {"Number":"56","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"57","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"58","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"59","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"60","Tier":"LEGEND","Name":"Chuck Bednarik","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Golden Age","Team":"Philadelphia Eagles","Signature Stat":"1","Stat Label":"Championship","Stat Weight":"2","Role":"Center/Linebacker","Fun Fact":"He was the last two-way player in NFL history - played both center on offense and linebacker on defense - Concrete Charlie was a different species","Notes":""},
  {"Number":"61","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"62","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"63","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"64","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"65","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"66","Tier":"LEGEND","Name":"Mario Lemieux","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Dynasty","Team":"Pittsburgh Penguins","Signature Stat":"1033","Stat Label":"Career Points","Stat Weight":"3","Role":"Center","Fun Fact":"He survived cancer mid-career, came back and scored a goal in his first game back, and then won a second Stanley Cup - the most remarkable comeback in hockey history","Notes":"#66 retired by Penguins - played on same line as Jagr #68"},
  {"Number":"67","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"68","Tier":"LEGEND","Name":"Jaromir Jagr","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"Pittsburgh Penguins","Signature Stat":"1921","Stat Label":"Career Points","Stat Weight":"3","Role":"Right Wing","Fun Fact":"He chose #68 to honor the Prague Spring of 1968 when Soviet tanks rolled into Czechoslovakia - every time he put on the jersey it meant something political and personal","Notes":"Adjacent to Lemieux #66 - two linemates, two Legends"},
  {"Number":"69","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":"NBA does not issue #69"},
  {"Number":"70","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"71","Tier":"LEGEND","Name":"Evgeni Malkin","Sport":"Hockey","League":"NHL","Status":"Active","Era":"NHL Modern","Team":"Pittsburgh Penguins","Signature Stat":"3","Stat Label":"Stanley Cups","Stat Weight":"3","Role":"Center","Fun Fact":"He was the second-best player on his team for most of his career - which on any other team would make him the best player - three Cups with Crosby","Notes":"Active but passes Legend test per tier list"},
  {"Number":"72","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"73","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":"Hannah is Boston wall - globally still unwritten"},
  {"Number":"74","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"75","Tier":"LEGEND","Name":"Mean Joe Greene","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Dynasty","Team":"Pittsburgh Steelers","Signature Stat":"4","Stat Label":"Super Bowl Rings","Stat Weight":"3","Role":"Defensive Tackle","Fun Fact":"The Coca-Cola ad where he gives a kid his jersey made him the most famous defensive player in America - four Super Bowls and the face of the Steel Curtain","Notes":""},
  {"Number":"76","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"77","Tier":"LEGEND","Name":"Ray Bourque","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"Boston Bruins","Signature Stat":"1169","Stat Label":"Career Points (D record)","Stat Weight":"3","Role":"Defenseman","Fun Fact":"He gave up his #7 so Phil Esposito could retire it - wore #77 for the rest of his career - and the whole league cheered when he finally won the Cup in Colorado at 40","Notes":"#77 retired by Bruins"},
  {"Number":"78","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":"Bruce Smith 200 sacks - consider for v1.5"},
  {"Number":"79","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"80","Tier":"LEGEND","Name":"Jerry Rice","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Dynasty","Team":"San Francisco 49ers","Signature Stat":"22895","Stat Label":"Career Receiving Yards","Stat Weight":"3","Role":"Wide Receiver","Fun Fact":"NFL.com named him the greatest player in NFL history - not the greatest receiver - the greatest player, period - and it's hard to argue","Notes":""},
  {"Number":"81","Tier":"LEGEND","Name":"Terrell Owens","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"San Francisco 49ers","Signature Stat":"153","Stat Label":"Career Receiving TDs","Stat Weight":"2","Role":"Wide Receiver","Fun Fact":"He did situps in his driveway during a public holdout and made it appointment television - one of the most explosive and controversial players in NFL history","Notes":""},
  {"Number":"82","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"83","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":"Welker is Boston wall - globally unwritten"},
  {"Number":"84","Tier":"LEGEND","Name":"Randy Moss","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Minnesota Vikings","Signature Stat":"156","Stat Label":"Career Receiving TDs","Stat Weight":"3","Role":"Wide Receiver","Fun Fact":"He ran past defenders so easily in his prime that it looked like they were standing still - the most physically gifted receiver in NFL history","Notes":"Note: wore #84 in Minnesota, #81 in New England"},
  {"Number":"85","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"86","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"87","Tier":"RISING","Name":"Sidney Crosby","Sport":"Hockey","League":"NHL","Status":"Active","Era":"NHL Now","Team":"Pittsburgh Penguins","Signature Stat":"3","Stat Label":"Stanley Cups","Stat Weight":"3","Role":"Center","Fun Fact":"He shot pucks at a dryer in his basement as a kid until the dryer broke - the work ethic behind three Stanley Cups and three Hart Trophies","Notes":"RISING - review annually"},
  {"Number":"87","Tier":"RISING","Name":"Travis Kelce","Sport":"Football","League":"NFL","Status":"Active","Era":"NFL Now","Team":"Kansas City Chiefs","Signature Stat":"4","Stat Label":"Super Bowl Rings","Stat Weight":"3","Role":"Tight End","Fun Fact":"He has four Super Bowl rings and is the most reliable weapon any quarterback has ever had - the greatest tight end of his era and maybe ever","Notes":"RISING - review annually - may move to Legend on retirement"},
  {"Number":"88","Tier":"LEGEND","Name":"Eric Lindros","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"Philadelphia Flyers","Signature Stat":"372","Stat Label":"Career Goals","Stat Weight":"2","Role":"Center","Fun Fact":"He was the most physically dominant player in the NHL in the mid-90s - 6-foot-4 and could skate like a wing - concussions cut short what could have been the greatest career ever","Notes":""},
  {"Number":"88","Tier":"LEGEND","Name":"Tony Gonzalez","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Kansas City Chiefs","Signature Stat":"1325","Stat Label":"Career Receptions","Stat Weight":"3","Role":"Tight End","Fun Fact":"He has 1,325 career receptions - the most by any tight end in NFL history - and redefined what the position could be","Notes":"#88 is most HOF-crowded number in NFL history per tier list"},
  {"Number":"89","Tier":"LEGEND","Name":"Mike Ditka","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Golden Age","Team":"Chicago Bears","Signature Stat":"427","Stat Label":"Career Receiving Yards as TE","Stat Weight":"2","Role":"Tight End","Fun Fact":"He was the first tight end inducted into the Pro Football Hall of Fame - revolutionized the position - and then coached the Bears to the greatest season in NFL history in 1985","Notes":""},
  {"Number":"90","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"91","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"92","Tier":"LEGEND","Name":"Michael Strahan","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"New York Giants","Signature Stat":"141.5","Stat Label":"Career Sacks","Stat Weight":"2","Role":"Defensive End","Fun Fact":"He set the single-season sack record with 22.5 in 2001 - and helped the Giants beat the undefeated Patriots in Super Bowl XLII - one of the greatest upsets in NFL history","Notes":""},
  {"Number":"92","Tier":"LEGEND","Name":"Reggie White","Sport":"Football","League":"NFL","Status":"Retired","Era":"NFL Modern","Team":"Green Bay Packers","Signature Stat":"198","Stat Label":"Career Sacks","Stat Weight":"3","Role":"Defensive End","Fun Fact":"The Minister of Defense - 198 career sacks - a Hall of Famer who combined uncommon physical gifts with genuine religious conviction that he wore openly","Notes":""},
  {"Number":"93","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":"Seymour is Boston wall - globally unwritten"},
  {"Number":"94","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"95","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"96","Tier":"LEGEND","Name":"Pavel Bure","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL Modern","Team":"Vancouver Canucks","Signature Stat":"437","Stat Label":"Career Goals","Stat Weight":"3","Role":"Right Wing","Fun Fact":"He scored 60 goals in back-to-back seasons in 1993-94 and 1994-95 - the Russian Rocket was the most electrifying player of his era","Notes":""},
  {"Number":"97","Tier":"RISING","Name":"Connor McDavid","Sport":"Hockey","League":"NHL","Status":"Active","Era":"NHL Now","Team":"Edmonton Oilers","Signature Stat":"153","Stat Label":"Points in 2022-23","Stat Weight":"3","Role":"Center","Fun Fact":"He skates faster than anyone who has ever played the game - multiple Hart Trophies and Art Ross Trophies - the best player in hockey right now without debate","Notes":"RISING - review annually"},
  {"Number":"98","Tier":"UNWRITTEN","Name":"","Sport":"","League":"","Status":"Retired","Era":"","Team":"","Signature Stat":"","Stat Label":"","Stat Weight":"0","Role":"","Fun Fact":"","Notes":""},
  {"Number":"99","Tier":"SACRED","Name":"Wayne Gretzky","Sport":"Hockey","League":"NHL","Status":"Retired","Era":"NHL All-Time","Team":"Edmonton Oilers","Signature Stat":"2857","Stat Label":"Career Points","Stat Weight":"3","Role":"Center","Fun Fact":"If you remove every goal he ever scored he would still be the all-time points leader just from his assists - #99 was retired across the entire NHL in 1999","Notes":"SACRED - retired across all NHL"}
];
const SPORT_ICON_MAP = { Basketball:"🏀", Football:"🏈", Baseball:"⚾", Hockey:"🏒", Soccer:"⚽" };

function parseCSVLine(line) {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += line[i]; }
  }
  result.push(cur.trim());
  return result;
}

function buildNumberData(rows) {
  const data = {};
  for (let i = 1; i <= 99; i++) data[i] = { tier:TIER.UNWRITTEN, players:[] };
  rows.forEach(r => {
    const num = parseInt(r["Number"]);
    if (!num || isNaN(num) || !r["Name"]) return;
    const sport = r["Sport"] || "";
    const player = {
      name: r["Name"], sport, league: r["League"] || "",
      team: r["City + Team"] || r["Team"] || "",
      status: r["Status"] || "Retired", era: r["Era"] || "",
      stat: r["Signature Stat"] || r["Stat"] || "",
      statLabel: r["Stat Label"] || r["StatLabel"] || "",
      statWeight: parseInt(r["Stat Weight"] || r["StatWeight"]) || 1,
      role: r["Role"] || "", funFact: r["Fun Fact"] || r["FunFact"] || "",
      icon: SPORT_ICON_MAP[sport] || "🏅",
    };
    if (!data[num]) data[num] = { tier:TIER.UNWRITTEN, players:[] };
    data[num].players.push(player);
    const t = (r["Tier"] || "").toUpperCase().trim();
    if      (t === "SACRED")                                data[num].tier = TIER.SACRED;
    else if (t === "LEGEND" && data[num].tier !== TIER.SACRED) data[num].tier = TIER.LEGEND;
    else if (t === "" && data[num].tier === TIER.UNWRITTEN) data[num].tier = TIER.LEGEND;
  });
  return data;
}

const EMPTY_GRID     = Object.fromEntries(Array.from({length:99},(_,i) => [i+1,{tier:TIER.UNWRITTEN,players:[]}]));
const SACRED_NUMBERS = { 6:"NBA", 23:"NBA", 42:"MLB", 99:"NHL" };

// ── SACRED CARD CONTENT ───────────────────────────────────────
const CARD_CONTENT = {
  6: {
    stacks: [{ name:"Bill Russell", sport:"NBA",
      body:"Bill Russell won 11 NBA championships in 13 seasons. Not 11 trophies. Eleven times his team was the best in the world. He anchored a Boston Celtics dynasty that was the most dominant run in North American pro sports history - and he did it while facing racism that would have broken most people.",
      waitWhat:"The NBA retired #6 league-wide in 2022 - 55 years after his last championship. Russell is the only player in NBA history given that honor. Because some things take time to understand.",
    }],
    sacredLine:"THE ONLY NUMBER THE NBA HAS EVER RETIRED LEAGUE-WIDE",
  },
  23: {
    stacks: [
      { name:"Michael Jordan", sport:"NBA",
        body:"Six championships. Six Finals MVPs. Five league MVPs. Michael Jordan didn't just win - he made losing feel impossible. The NBA did something it had never done before: retired his number across all 30 franchises, for all time.",
        waitWhat:"Jordan is one of only two players the NBA has ever honored this way. The other is Bill Russell (#6). Two players. Sixty years of basketball. That's it.",
      },
      { name:"LeBron James", sport:"NBA",
        connector:"There was just one problem. The greatest player of the next generation had already been wearing #23 his whole career. And he wasn't about to stop.",
        body:"Four championships. Four Finals MVPs. The all-time NBA scoring leader. LeBron James is the argument you make when someone says Jordan is untouchable. The league looked the other way - he's the only player ever granted an exception to a retired number.",
      },
    ],
    sacredLine:"RETIRED LEAGUE-WIDE — WITH ONE DOCUMENTED EXCEPTION",
  },
  42: {
    stacks: [{ name:"Jackie Robinson", sport:"MLB",
      body:"In 1947, Jackie Robinson walked onto a Major League Baseball field and changed the country. Six-time All-Star. 1949 MVP. Rookie of the Year. He walked into a world that didn't want him there - through death threats and hatred - with more dignity than the game deserved. His number isn't retired because of the stats.",
      waitWhat:"In 1997, MLB retired #42 across every team in baseball - the only time a sport has done that for a position player. Every April 15th, every player wears #42. The number belongs to everyone now, and to no one.",
    }],
    sacredLine:"THE ONLY NUMBER RETIRED ACROSS ALL OF MAJOR LEAGUE BASEBALL",
  },
  99: {
    stacks: [{ name:"Wayne Gretzky", sport:"NHL",
      body:"Wayne Gretzky holds 61 NHL records. If you removed every goal he ever scored, he'd still be the all-time points leader - just from his assists. Nine Hart Trophies. Four Stanley Cups. Over two points per game for his entire career. There is no debate. There's just Gretzky, and then everyone else.",
      waitWhat:"In 1999, the NHL retired #99 across every franchise - no player can ever wear it again. He chose 99 as a kid because all the single digits were taken. A number nobody wanted became the number no one can have.",
    }],
    sacredLine:"THE ONLY NUMBER RETIRED ACROSS ALL OF THE NHL",
  },
};

// ── TIER COLORS ───────────────────────────────────────────────
const TIER_COLORS = {
  SACRED:    { bg:"rgba(220,235,255,0.12)", text:"rgba(230,240,255,0.95)", border:"rgba(200,220,255,0.55)", glow:"0 0 18px rgba(200,220,255,0.45), 0 0 36px rgba(180,210,255,0.15)", accent:"#C8DCFF" },
  LEGEND:    { bg:"rgba(200,50,0,0.45)",   text:"rgba(255,150,80,1)",     border:"rgba(255,80,0,0.55)",   glow:"0 0 12px rgba(255,80,0,0.4), 0 0 28px rgba(255,80,0,0.15)",       accent:"#FF8C42" },
  RISING:    { bg:"rgba(80,200,0,0.18)",   text:"rgba(160,240,60,0.95)", border:"rgba(120,220,20,0.45)", glow:"0 0 12px rgba(120,220,20,0.3), 0 0 24px rgba(120,220,20,0.1)",     accent:"#8FD920" },
  UNWRITTEN: { bg:"rgba(255,255,255,0.06)",text:"rgba(255,255,255,0.42)",border:"rgba(255,255,255,0.22)",glow:"none",                                                              accent:"rgba(255,255,255,0.2)" },
};

function tierColors(tier, isSelected) {
  if (isSelected) return { bg:"rgba(255,255,255,0.15)", text:"#fff", border:"rgba(255,255,255,0.8)", glow:"0 0 0 2px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.3)", accent:"#fff" };
  return TIER_COLORS[tier] || TIER_COLORS.UNWRITTEN;
}

// ── COMPONENT ────────────────────────────────────────────────
export default function WornNumbers() {
  const [selected, setSelected]     = useState(null);
  const [sport, setSport]           = useState("ALL");
  const [numberData, setNumberData] = useState(EMPTY_GRID);
  const [loading, setLoading]       = useState(true);
  const [isDesktop, setIsDesktop]   = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const filterRef = useRef(null);
  const sheetRef  = useRef(null);

  useEffect(() => {
    // Load static data immediately — wall always renders
    const applyBuilt = (built) => {
      Object.keys(SACRED_NUMBERS).forEach(n => {
        if (built[n]) { built[n].sacredSport = SACRED_NUMBERS[n]; built[n].tier = TIER.SACRED; }
      });
      return built;
    };
    setNumberData(applyBuilt(buildNumberData(GLOBAL_WALL_STATIC)));
    setLoading(false);

    // Try live sheet in background
    fetch(SHEET_URL, { redirect: "follow" })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(csv => {
        const lines = csv.split("\n").filter(Boolean);
        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(line => {
          const vals = parseCSVLine(line); const obj = {};
          headers.forEach((h,i) => obj[h] = vals[i] || ""); return obj;
        });
        setNumberData(applyBuilt(buildNumberData(rows)));
      })
      .catch(() => { /* static data already loaded */ });
  }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 960);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get("n"));
    if (!isNaN(n) && n >= 0 && n <= 99) setSelected(n);
  }, []);

  useEffect(() => {
    if (selected === null) return;
    const names = selectedPlayers.map(p => p.name).join(" · ");
    const ogUrl = `https://thenumberwall.com/api/og?n=${selected}`;
    const setMeta = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(prop.startsWith("og:")|| prop.startsWith("twitter:") ? "property" : "name", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("og:title", `#${selected} on The Number Wall`);
    setMeta("og:description", names || `Who wore #${selected}?`);
    setMeta("og:image", ogUrl); setMeta("og:url", `https://thenumberwall.com/?n=${selected}`);
    setMeta("twitter:card","summary_large_image"); setMeta("twitter:image", ogUrl);
  }, [selected]);

  useEffect(() => { if (filterRef.current) filterRef.current.scrollLeft = 0; }, [sport]);

  const handleShare = () => {
    const url = `${window.location.origin}/?n=${selected}`;
    const names = selectedPlayers.map(p => p.name).join(" · ");
    if (navigator.share) navigator.share({ title:`#${selected} on The Number Wall`, text:names, url });
    else { navigator.clipboard?.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }
  };

  const filteredPlayers = (num) => {
    const d = numberData[num];
    if (!d || !d.players) return [];
    if (sport === "ALL") return d.players;
    const vals = SPORT_FILTER_MAP[sport] || [sport];
    return d.players.filter(p => vals.includes(p.sport) || vals.includes(p.league));
  };

  const selectedData    = selected !== null ? numberData[selected] : null;
  const selectedPlayers = selected !== null ? filteredPlayers(selected) : [];
  const selectedTier    = selectedData?.tier || TIER.UNWRITTEN;
  const selectedColors  = tierColors(selectedTier, false);
  const selectedAccent  = selectedColors.accent;

  // ── GRID CELL ─────────────────────────────────────────────
  const renderCell = (num) => {
    const tier        = numberData[num]?.tier || TIER.UNWRITTEN;
    const allP        = numberData[num]?.players || [];
    const filtP       = filteredPlayers(num);
    const hasP        = filtP.length > 0;
    const dimmed      = sport !== "ALL" && !hasP;
    const playerCount = sport === "ALL" ? allP.length : filtP.length;
    const isSelected  = selected === num;
    const sacredSport = numberData[num]?.sacredSport;
    const sacredActive  = tier === TIER.SACRED && (sport === "ALL" || sport === sacredSport);
    const effectiveTier = sacredActive ? tier : (tier === TIER.SACRED ? TIER.LEGEND : tier);

    let colors;
    if (dimmed && !isSelected) {
      colors = { ...TIER_COLORS.UNWRITTEN, glow:"none" };
    } else {
      const base = tierColors(effectiveTier, isSelected);
      colors = base;
      if ((effectiveTier === TIER.LEGEND || effectiveTier === TIER.RISING) && !isSelected) {
        if      (playerCount >= 6)  colors = { ...base, bg:"rgba(220,70,0,0.75)",  text:"rgba(255,210,120,1)", border:"rgba(255,120,20,1)",   glow:"0 0 22px rgba(255,120,20,0.85),0 0 44px rgba(255,80,0,0.45)" };
        else if (playerCount >= 4)  colors = { ...base, bg:"rgba(210,60,0,0.65)",  text:"rgba(255,190,100,1)", border:"rgba(255,100,20,0.9)", glow:"0 0 18px rgba(255,100,20,0.7),0 0 36px rgba(255,80,0,0.35)" };
        else if (playerCount >= 3)  colors = { ...base, bg:"rgba(200,50,0,0.55)",  text:"rgba(255,170,85,1)",  border:"rgba(255,85,10,0.75)", glow:"0 0 14px rgba(255,85,10,0.55),0 0 28px rgba(255,70,0,0.25)" };
        else if (playerCount === 2) colors = { ...base, bg:"rgba(180,40,0,0.45)",  text:"rgba(255,145,65,1)",  border:"rgba(240,70,5,0.6)",   glow:"0 0 10px rgba(240,70,5,0.4),0 0 20px rgba(220,60,0,0.15)" };
        else                        colors = { ...base, bg:"rgba(150,30,0,0.35)",  text:"rgba(220,110,50,0.9)",border:"rgba(200,55,0,0.45)",  glow:"0 0 6px rgba(200,55,0,0.3)" };
      }
    }

    return (
      <div key={num} className="cell"
        style={{ aspectRatio:"1", background:colors.bg, borderColor:colors.border,
          boxShadow:isSelected ? `0 0 0 2px ${colors.accent}, ${colors.glow}` : colors.glow,
          color:colors.text, fontFamily:MONUMENT, letterSpacing:1, cursor:"pointer" }}
        onClick={() => setSelected(selected === num ? null : num)}
      >
        <span className="cell-label">{num}</span>
      </div>
    );
  };

  // ── SHARE BUTTON ──────────────────────────────────────────
  const ShareBtn = () => (
    <button onClick={handleShare} style={{ display:"flex", alignItems:"center", gap:6,
      background:shareCopied?"rgba(143,217,32,0.1)":"rgba(232,124,42,0.1)",
      border:`1px solid ${shareCopied?"rgba(143,217,32,0.35)":"rgba(232,124,42,0.35)"}`,
      borderRadius:6, padding:"5px 12px",
      color:shareCopied?"#8FD920":"rgba(232,124,42,0.9)",
      fontFamily:MONO, fontSize:10, letterSpacing:1, cursor:"pointer", transition:"all 0.15s" }}>
      {shareCopied
        ? <><svg style={{width:11,height:11,fill:"currentColor"}} viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>&nbsp;COPIED</>
        : <><svg style={{width:12,height:12,fill:"currentColor"}} viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>&nbsp;SHARE #{selected}</>
      }
    </button>
  );

  // ── PANEL HEADER ──────────────────────────────────────────
  // FIX 1: X button position:absolute top-right, never inline
  // FIX 5: Sacred names removed from header entirely
  const renderPanelHeader = () => {
    if (selected === null) return null;
    return (
      <div style={{ position:"relative", marginBottom:16, paddingRight:44 }}>
        <button className="close-btn" onClick={() => setSelected(null)}
          style={{ position:"absolute", top:0, right:0 }}>✕</button>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:52, lineHeight:1, letterSpacing:2, color:selectedColors.text }}>
            #{selected}
          </div>
          <div>
            <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.28)", marginBottom:5 }}>
              {sport === "ALL" ? "ALL SPORTS" : sport} — JERSEY NUMBER
            </div>
            {selectedData?.tier === TIER.SACRED ? (
              <div style={{ display:"inline-block", background:"rgba(200,220,255,0.1)", border:"1px solid rgba(200,220,255,0.3)", borderRadius:6, padding:"3px 10px", fontSize:10, color:"#C8DCFF", fontFamily:MONO, letterSpacing:2 }}>
                {selectedData.sacredSport === "NBA" ? "RETIRED NBA-WIDE" : selectedData.sacredSport === "MLB" ? "RETIRED MLB-WIDE" : "RETIRED NHL-WIDE"}
              </div>
            ) : (
              <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:14, letterSpacing:1, color:"rgba(255,255,255,0.6)" }}>
                {selectedData?.tier === TIER.UNWRITTEN ? "UNWRITTEN"
                  : `${selectedPlayers.length} LEGEND${selectedPlayers.length !== 1 ? "S" : ""} WORE THIS`}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── PANEL CONTENT ─────────────────────────────────────────
  const renderPanelContent = () => {
    if (selected === null) return null;
    const content    = CARD_CONTENT[selected];
    const selPlayers = selectedPlayers;

    // FIX 5: Sacred cards — full player cards below header, no serif (FIX 9)
    if (content) {
      return (
        <div>
          {content.stacks.map((stack, si) => (
            <div key={si} className="player-card" style={{ marginBottom: si < content.stacks.length - 1 ? 12 : 0, padding:"18px 16px" }}>
              {content.stacks.length > 1 && (
                <div style={{ fontFamily:MONO, fontSize:10, letterSpacing:2, color:"rgba(255,255,255,0.3)", marginBottom:10 }}>{stack.sport}</div>
              )}
              <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:22, letterSpacing:1, color:"#fff", marginBottom:12 }}>{stack.name}</div>
              {/* FIX 9: No serif. Plain color:"rgba(255,255,255,0.75)" body text */}
              <p style={{ margin:"0 0 10px", fontSize:14, lineHeight:1.7, color:"rgba(255,255,255,0.75)" }}>{stack.body}</p>
              {stack.connector && (
                <p style={{ margin:"0 0 10px", fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.45)", borderLeft:`2px solid ${selectedAccent}`, paddingLeft:10 }}>
                  {stack.connector}
                </p>
              )}
              {stack.waitWhat && (
                <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 12px", marginTop:10 }}>
                  <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:3, color:selectedAccent, marginBottom:6 }}>WAIT, WHAT?</div>
                  <p style={{ margin:0, fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.55)" }}>{stack.waitWhat}</p>
                </div>
              )}
            </div>
          ))}
          {content.sacredLine && (
            <div style={{ marginTop:12, padding:"12px 16px", borderRadius:8, background:"rgba(200,220,255,0.05)", border:"1px solid rgba(200,220,255,0.18)", textAlign:"center" }}>
              <span style={{ fontFamily:MONO, fontSize:11, letterSpacing:2, color:"#C8DCFF" }}>{content.sacredLine}</span>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.18)" }}>THENUMBERWALL.COM · #{selected}</span>
            <ShareBtn />
          </div>
        </div>
      );
    }

    // Unwritten
    if (selectedData?.tier === TIER.UNWRITTEN) {
      return (
        <div style={{ padding:"20px 0 12px" }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:18, letterSpacing:3, color:"rgba(255,255,255,0.18)", marginBottom:14 }}>#{selected} — UNWRITTEN</div>
            <p style={{ fontSize:22, lineHeight:1.4, margin:"0 auto", maxWidth:300, color:"rgba(255,255,255,0.7)", fontFamily:MONUMENT, fontWeight:900, letterSpacing:1 }}>
              This one hasn't found its legend
            </p>
            <p style={{ fontSize:22, lineHeight:1.4, margin:"4px auto 0", maxWidth:300, fontFamily:MONUMENT, fontWeight:900, letterSpacing:1, color:"rgba(255,255,255,0.28)" }}>Yet.</p>
          </div>
          <div style={{ textAlign:"center", marginBottom:24, fontFamily:MONO, fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.18)", lineHeight:1.7 }}>
            NO LEGEND HAS CLAIMED #{selected}<br/>ACROSS HOCKEY · BASKETBALL · FOOTBALL · BASEBALL · SOCCER
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:18, textAlign:"center" }}>
            <div style={{ fontFamily:MONO, fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.18)", marginBottom:10 }}>THINK WE MISSED SOMEONE?</div>
            <button style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"9px 20px", fontFamily:MONO, fontSize:12, letterSpacing:2, color:"rgba(255,255,255,0.35)", cursor:"pointer" }}
              onClick={() => alert("Community nominations coming soon - nominate a legend for #" + selected + ".")}>
              NOMINATE A LEGEND →
            </button>
          </div>
        </div>
      );
    }

    // Standard legend/rising
    return (
      <>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {selPlayers.length > 0 ? selPlayers.map((p, i) => (
            <div key={i} className="player-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"nowrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                  <span style={{ fontSize:22 }}>{p.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:21, letterSpacing:1, lineHeight:1, marginBottom:4, color:"#fff" }}>{p.name}</div>
                    <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, fontFamily:MONO, color:"rgba(255,255,255,0.5)", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:4, padding:"2px 7px", letterSpacing:1 }}>
                        {p.sport}{p.league && p.league !== p.sport ? ` · ${p.league}` : ""}
                      </span>
                      {p.team && (
                        <span style={{ fontSize:10, fontFamily:MONO, color:"rgba(255,255,255,0.5)", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:4, padding:"1px 7px", letterSpacing:1 }}>{p.team}</span>
                      )}
                      {/* FIX 3: Active = plain label, no green badge */}
                      {p.status === "Active" && (
                        <span style={{ fontSize:10, fontFamily:MONO, color:"rgba(255,255,255,0.4)", letterSpacing:1 }}>ACTIVE</span>
                      )}
                      {p.era && <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:MONO }}>{p.era}</span>}
                      {p.role && <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:MONO }}>{p.role}</span>}
                    </div>
                    {p.funFact && <div style={{ marginTop:6, fontSize:12, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>{p.funFact}</div>}
                  </div>
                </div>
                {p.stat && p.stat !== "-" && (
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                    <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:28, lineHeight:1, color:selectedColors.text }}>{p.stat}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontFamily:MONO, letterSpacing:1, maxWidth:110, textAlign:"right", lineHeight:1.3 }}>{p.statLabel}</div>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div style={{ textAlign:"center", padding:"28px 0", color:"rgba(255,255,255,0.2)", fontFamily:MONO, fontSize:13 }}>
              {sport !== "ALL" ? `No ${sport} legends for #${selected}` : `No legend data for #${selected}`}
            </div>
          )}
        </div>
        {selPlayers.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.18)" }}>THENUMBERWALL.COM · #{selected}</span>
            <ShareBtn />
          </div>
        )}
      </>
    );
  };

  // ── CITY CHOOSER ─────────────────────────────────────────
  // FIX 4: All tiles same base style. Boston: orange "EXPLORE →". Others: greyed "COMING SOON"
  const renderCityChooser = () => (
    <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"40px 16px 48px", textAlign:"center", background:"rgba(0,0,0,0.3)" }}>
      <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:26, letterSpacing:3, marginBottom:6 }}>YOUR CITY. YOUR NUMBERS.</div>
      <div style={{ fontFamily:ACCENT, fontStyle:"italic", fontSize:18, color:"#E87C2A", textShadow:"0 0 14px rgba(232,124,42,0.45)", marginBottom:28 }}>
        Dig deep into the legends who built your city.
      </div>
      <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <a href="/boston" style={{ textDecoration:"none" }}>
          <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:12, padding:"14px 24px", cursor:"pointer", transition:"all 0.2s", minWidth:140 }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.28)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.14)"; }}>
            <div style={{ fontSize:20, marginBottom:6 }}>🏙</div>
            <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:17, letterSpacing:2, color:"#fff" }}>BOSTON</div>
            <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"#E87C2A", marginTop:5 }}>EXPLORE →</div>
          </div>
        </a>
        {["NEW YORK","CHICAGO"].map(city => (
          <div key={city} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 24px", minWidth:140 }}>
            <div style={{ fontSize:20, marginBottom:6, opacity:0.25 }}>🏙</div>
            <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:17, letterSpacing:2, color:"rgba(255,255,255,0.22)" }}>{city}</div>
            <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.18)", marginTop:5 }}>COMING SOON</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── MAIN RENDER ───────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#080c10", color:"white", position:"relative" }}>
      {loading && (
        <div style={{ position:"fixed", inset:0, background:"#080c10", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
          <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:30, letterSpacing:4, color:"rgba(255,255,255,0.28)" }}>THE NUMBER WALL</div>
          <div style={{ fontFamily:MONO, fontSize:10, letterSpacing:3, color:"rgba(255,107,0,0.6)" }}>LOADING LEGENDS...</div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=Space+Mono&family=Playfair+Display:ital@1&display=swap');
        * { box-sizing:border-box; }
        html, body { margin:0; padding:0; overflow-x:hidden; -webkit-text-size-adjust:100%; }
        /* FIX 2: scanline removed entirely */
        .cell { border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:900; transition:transform 0.15s ease,box-shadow 0.15s ease; position:relative; border:1px solid; user-select:none; }
        .cell:hover { transform:scale(1.18) !important; z-index:10; }
        .sport-pill { border-radius:20px; padding:5px 12px; font-size:11px; cursor:pointer; border:1px solid; transition:all 0.2s; letter-spacing:1px; font-family:'Space Mono','Courier New',monospace; }
        .sport-pill:hover { transform:translateY(-1px); }
        .player-card { border-radius:10px; padding:14px 16px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); transition:all 0.2s; animation:cardIn 0.3s ease both; }
        .player-card:hover { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.14); transform:translateX(3px); }
        @keyframes cardIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes panelIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .panel-in { animation:panelIn 0.35s ease both; }
        .close-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14); border-radius:7px; color:rgba(255,255,255,0.45); cursor:pointer; padding:4px 10px; font-size:12px; transition:all 0.2s; font-family:'Space Mono',monospace; }
        .close-btn:hover { background:rgba(255,255,255,0.12); color:white; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.14); border-radius:2px; }
        .grid-wrap { display:grid; grid-template-columns:repeat(8,1fr); gap:3px; }
        .cell-label { font-size:11px; }
        .sport-filter-wrap { display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px; }
        .sport-filter-wrap::-webkit-scrollbar { display:none; }
        .desktop-layout { display:flex; height:calc(100vh - 110px); }
        .desktop-grid-col { flex:0 0 61.8%; overflow-y:auto; padding:16px 14px; border-right:1px solid rgba(255,255,255,0.06); }
        .desktop-panel-col { flex:0 0 38.2%; overflow-y:auto; padding:20px; display:flex; flex-direction:column; }
        .bottom-sheet { position:fixed; bottom:0; left:0; right:0; background:#0d1117; border-top:1px solid rgba(255,255,255,0.1); border-radius:18px 18px 0 0; z-index:200; max-height:72vh; overflow-y:auto; padding:0 16px 40px; transition:transform 0.35s cubic-bezier(0.32,0.72,0,1); -webkit-overflow-scrolling:touch; }
        .sheet-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:199; backdrop-filter:blur(2px); }
        @media (min-width:480px) { .grid-wrap { grid-template-columns:repeat(10,1fr); gap:4px; } .cell-label { font-size:12px; } }
        @media (min-width:700px) { .grid-wrap { grid-template-columns:repeat(11,1fr); gap:5px; } }
        @media (min-width:960px) { .grid-wrap { grid-template-columns:repeat(11,1fr); gap:6px; } }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"10px 14px 10px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:100 }}>
        {/* FIX 6: About link in header */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:4 }}>
          <a href="/about" style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.22)", textDecoration:"none", transition:"color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color="rgba(255,255,255,0.55)"}
            onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.22)"}>ABOUT</a>
        </div>
        <div style={{ textAlign:"center", marginBottom:8 }}>
          {/* FIX 2 + 10: Barlow Condensed 900, no text-shadow on title */}
          <h1 style={{ margin:0, lineHeight:1, fontFamily:MONUMENT, fontWeight:900, fontSize:"clamp(24px,5vw,38px)", letterSpacing:3 }}>THE NUMBER WALL</h1>
          <div style={{ fontFamily:ACCENT, fontStyle:"italic", fontSize:18, color:"#E87C2A", textShadow:"0 0 18px rgba(232,124,42,0.45)", marginTop:3 }}>Legends live here.</div>
        </div>
        <div ref={filterRef} className="sport-filter-wrap">
          {SPORTS.map(s => {
            const active = sport === s;
            return (
              <button key={s} className="sport-pill"
                style={{ background:active?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.04)", borderColor:active?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.1)", color:active?"#0a0d14":"rgba(255,255,255,0.4)", boxShadow:active?"0 0 10px rgba(255,255,255,0.2)":"none", flexShrink:0 }}
                onClick={() => setSport(s)}>{s}</button>
            );
          })}
        </div>
        <div style={{ textAlign:"center", marginTop:7, fontFamily:MONO, fontSize:9, letterSpacing:3, color:"rgba(255,255,255,0.16)" }}>PICK A NUMBER.</div>
      </div>

      {/* DESKTOP */}
      {isDesktop ? (
        <div className="desktop-layout">
          <div className="desktop-grid-col">
            <div className="grid-wrap">{Array.from({length:99},(_,i) => renderCell(i+1))}</div>
          </div>
          <div className="desktop-panel-col">
            {selected === null ? (
              <div style={{ margin:"auto", textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontFamily:MONUMENT, fontWeight:900, fontSize:42, color:"rgba(255,255,255,0.05)", letterSpacing:4, lineHeight:1, marginBottom:14 }}>THE NUMBER<br/>WALL</div>
                <div style={{ fontFamily:MONO, fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.16)" }}>PICK A NUMBER TO<br/>MEET ITS LEGENDS</div>
              </div>
            ) : (
              <div className="panel-in" style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${selectedColors.border}`, borderRadius:12, padding:"18px 20px", boxShadow:`0 0 36px ${selectedColors.border}16` }}>
                {renderPanelHeader()}
                {renderPanelContent()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding:"10px 12px", overflowX:"hidden", maxWidth:"100vw" }}>
          <div className="grid-wrap">{Array.from({length:99},(_,i) => renderCell(i+1))}</div>
        </div>
      )}

      {/* CITY CHOOSER */}
      {renderCityChooser()}

      {/* FIX 6: FOOTER */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px 16px", background:"rgba(0,0,0,0.4)", textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, flexWrap:"wrap", marginBottom:8 }}>
          {[["THE BOSTON WALL","/boston"],["ABOUT","/about"],["CONTACT","mailto:dmurphy.dpm@gmail.com"]].map(([label,href]) => (
            <a key={label} href={href} style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.25)", textDecoration:"none", transition:"color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color="rgba(255,255,255,0.55)"}
              onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.25)"}>{label}</a>
          ))}
        </div>
        <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.12)" }}>
          © {new Date().getFullYear()} THE NUMBER WALL · THENUMBERWALL.COM
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET */}
      {!isDesktop && selected !== null && (
        <>
          <div className="sheet-overlay" onClick={() => setSelected(null)} />
          <div className="bottom-sheet" ref={sheetRef}>
            <div style={{ width:30, height:3, borderRadius:2, background:"rgba(255,255,255,0.14)", margin:"12px auto 14px" }} />
            {renderPanelHeader()}
            <div style={{ border:`1px solid ${selectedColors.border}16`, borderRadius:10, padding:"12px", background:"rgba(255,255,255,0.02)" }}>
              {renderPanelContent()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
