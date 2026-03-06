import { useState, useEffect, useRef } from "react";

// --- SPORTS ------------------------------------------------------------------
const SPORTS = ["ALL","Hockey","Basketball","Football","Baseball","Soccer"];
// Single color language - white active state, no per-sport hues
const SPORT_TAB = {
  active:   { bg:"rgba(255,255,255,0.92)", border:"rgba(255,255,255,0.9)", color:"#0a0d14", glow:"0 0 12px rgba(255,255,255,0.35)" },
  inactive: { bg:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.45)", glow:"none" },
};

// --- TIER SYSTEM -------------------------------------------------------------
// heat values: SACRED=10, LEGEND=8, RISING=5, UNWRITTEN=1
const TIER = { SACRED:"SACRED", LEGEND:"LEGEND", RISING:"RISING", UNWRITTEN:"UNWRITTEN" };

const tierHeat = { SACRED:10, LEGEND:8, RISING:5, UNWRITTEN:1 };

// --- NUMBER DATA -------------------------------------------------------------
// players: { name, sport, era, stat, statLabel, role, icon }
const NUMBER_DATA = {
  1: { tier:TIER.LEGEND, players:[
    { name:"Oscar Robertson", sport:"NBA", league:"NBA", status:"Retired", era:"1960-1974", team:"Cincinnati Royals", stat:"9887", statLabel:"Career Assists", role:"Point Guard", icon:"🏀" },
    { name:"Ozzie Smith", sport:"MLB", league:"MLB", status:"Retired", era:"1978-1996", team:"St. Louis Cardinals", stat:"2460", statLabel:"Career Assists (SS record)", role:"Shortstop", icon:"⚾" },
    { name:"Warren Moon", sport:"NFL", league:"NFL", status:"Retired", era:"1984-2000", team:"Houston Oilers", stat:"49325", statLabel:"Career Passing Yards", role:"Quarterback", icon:"🏈" },
    { name:"Terry Sawchuk", sport:"NHL", league:"NHL", status:"Retired", era:"1949-1970", team:"Detroit Red Wings", stat:"103", statLabel:"Career Shutouts", role:"Goaltender", icon:"🏒" },
    { name:"Bryce Harper", sport:"MLB", league:"MLB", status:"Active", era:"2012-pres", team:"Philadelphia Phillies", stat:"2", statLabel:"MVP Awards", role:"Right Field", icon:"⚾" },
    { name:"Alexia Putellas", sport:"Soccer", league:"Liga F", status:"Active", era:"2012-pres", team:"FC Barcelona", stat:"2", statLabel:"Ballon d'Or Awards", role:"Midfielder", icon:"⚽" },
  ]},
  2: { tier:TIER.LEGEND, players:[
    { name:"Derek Jeter", sport:"MLB", league:"MLB", status:"Retired", era:"1995-2014", team:"New York Yankees", stat:"3465", statLabel:"Career Hits", role:"Shortstop", icon:"⚾" },
    { name:"Eddie Shore", sport:"NHL", league:"NHL", status:"Retired", era:"1926-1940", team:"Boston Bruins", stat:"4", statLabel:"Hart Trophies", role:"Defenseman", icon:"🏒" },
    { name:"Brian Leetch", sport:"NHL", league:"NHL", status:"Retired", era:"1988-2006", team:"New York Rangers", stat:"1028", statLabel:"Career Points", role:"Defenseman", icon:"🏒" },
    { name:"Kawhi Leonard", sport:"NBA", league:"NBA", status:"Active", era:"2011-pres", team:"LA Clippers", stat:"2", statLabel:"Championships", role:"Small Forward", icon:"🏀" },
  ]},
  3: { tier:TIER.LEGEND, players:[
    { name:"Babe Ruth", sport:"MLB", league:"MLB", status:"Retired", era:"1914-1935", team:"New York Yankees", stat:"714", statLabel:"Career Home Runs", role:"Right Field", icon:"⚾" },
    { name:"Dwyane Wade", sport:"NBA", league:"NBA", status:"Retired", era:"2003-2019", team:"Miami Heat", stat:"3", statLabel:"Championships", role:"Shooting Guard", icon:"🏀" },
    { name:"Jonathan Toews", sport:"NHL", league:"NHL", status:"Retired", era:"2006-2023", team:"Chicago Blackhawks", stat:"3", statLabel:"Stanley Cup Rings", role:"Center", icon:"🏒" },
    { name:"Candace Parker", sport:"NBA", league:"WNBA", status:"Retired", era:"2008-2023", team:"Los Angeles Sparks", stat:"2", statLabel:"Championships", role:"Forward", icon:"🏀" },
    { name:"Diana Taurasi", sport:"NBA", league:"WNBA", status:"Active", era:"2004-pres", team:"Phoenix Mercury", stat:"10000", statLabel:"Career Points (WNBA record)", role:"Guard", icon:"🏀" },
  ]},
  4: { tier:TIER.LEGEND, players:[
    { name:"Lou Gehrig", sport:"MLB", league:"MLB", status:"Retired", era:"1923-1939", team:"New York Yankees", stat:"1995", statLabel:"Consecutive Games", role:"First Base", icon:"⚾" },
    { name:"Bobby Orr", sport:"NHL", league:"NHL", status:"Retired", era:"1966-1979", team:"Boston Bruins", stat:"102", statLabel:"Career Goals (D)", role:"Defenseman", icon:"🏒" },
    { name:"Brett Favre", sport:"NFL", league:"NFL", status:"Retired", era:"1991-2010", team:"Green Bay Packers", stat:"297", statLabel:"TD Passes", role:"Quarterback", icon:"🏈" },
  ]},
  5: { tier:TIER.LEGEND, players:[
    { name:"Joe DiMaggio", sport:"MLB", league:"MLB", status:"Retired", era:"1936-1951", team:"New York Yankees", stat:"56", statLabel:"Game Hit Streak", role:"Center Field", icon:"⚾" },
    { name:"George Hainsworth", sport:"NHL", league:"NHL", status:"Retired", era:"1926-1937", team:"Montreal Canadiens", stat:"94", statLabel:"Career Shutouts", role:"Goaltender", icon:"🏒" },
    { name:"Donovan McNabb", sport:"NFL", league:"NFL", status:"Retired", era:"1999-2011", team:"Philadelphia Eagles", stat:"234", statLabel:"TD Passes", role:"Quarterback", icon:"🏈" },
  ]},
  6: { tier:TIER.SACRED, sacredSport:"NBA", players:[
    { name:"Bill Russell", sport:"NBA", league:"NBA", status:"Retired", era:"1956-1969", team:"Boston Celtics", stat:"11", statLabel:"Championships", role:"Center", icon:"🏀" },
  ]},
  7: { tier:TIER.LEGEND, players:[
    { name:"Mickey Mantle", sport:"MLB", league:"MLB", status:"Retired", era:"1951-1968", team:"New York Yankees", stat:"536", statLabel:"Career Home Runs", role:"Center Field", icon:"⚾" },
    { name:"Phil Esposito", sport:"NHL", league:"NHL", status:"Retired", era:"1963-1981", team:"Boston Bruins", stat:"717", statLabel:"Career Goals", role:"Center", icon:"🏒" },
    { name:"Cristiano Ronaldo", sport:"Soccer", league:"Premier League / La Liga", status:"Active", era:"2002-pres", team:"Al Nassr", stat:"900", statLabel:"Career Goals (all comps)", role:"Forward", icon:"⚽" },
  ]},
  8: { tier:TIER.LEGEND, players:[
    { name:"Cal Ripken Jr.", sport:"MLB", league:"MLB", status:"Retired", era:"1981-2001", team:"Baltimore Orioles", stat:"2632", statLabel:"Consecutive Games", role:"Shortstop", icon:"⚾" },
    { name:"Kobe Bryant", sport:"NBA", league:"NBA", status:"Retired", era:"1996-2016", team:"Los Angeles Lakers", stat:"33643", statLabel:"Career Points", role:"Shooting Guard", icon:"🏀" },
    { name:"Alex Ovechkin", sport:"NHL", league:"NHL", status:"Active", era:"2005-pres", team:"Washington Capitals", stat:"893", statLabel:"Career Goals", role:"Left Wing", icon:"🏒" },
  ]},
  9: { tier:TIER.LEGEND, players:[
    { name:"Gordie Howe", sport:"NHL", league:"NHL", status:"Retired", era:"1946-1980", team:"Detroit Red Wings", stat:"801", statLabel:"Career Goals", role:"Right Wing", icon:"🏒" },
    { name:"Ted Williams", sport:"MLB", league:"MLB", status:"Retired", era:"1939-1960", team:"Boston Red Sox", stat:".406", statLabel:"Season Batting AVG", role:"Left Field", icon:"⚾" },
    { name:"Rocket Richard", sport:"NHL", league:"NHL", status:"Retired", era:"1942-1960", team:"Montreal Canadiens", stat:"544", statLabel:"Career Goals", role:"Right Wing", icon:"🏒" },
    { name:"Ronaldo R9", sport:"Soccer", league:"La Liga", status:"Retired", era:"1994-2011", team:"Barcelona - Real Madrid", stat:"352", statLabel:"Club Goals", role:"Forward", icon:"⚽" },
  ]},
  10: { tier:TIER.LEGEND, players:[
    { name:"Pele", sport:"Soccer", league:"Brazilian Serie A", status:"Retired", era:"1956-1977", team:"Santos", stat:"1281", statLabel:"Career Goals (all comps)", role:"Forward", icon:"⚽" },
    { name:"Guy Lafleur", sport:"NHL", league:"NHL", status:"Retired", era:"1971-1991", team:"Montreal Canadiens", stat:"560", statLabel:"Career Goals", role:"Right Wing", icon:"🏒" },
    { name:"Steve Nash", sport:"NBA", league:"NBA", status:"Retired", era:"1996-2014", team:"Phoenix Suns", stat:"2", statLabel:"MVP Awards", role:"Point Guard", icon:"🏀" },
    { name:"Diego Maradona", sport:"Soccer", league:"Serie A", status:"Retired", era:"1976-1997", team:"Napoli - Barcelona", stat:"312", statLabel:"Club Goals", role:"Forward", icon:"⚽" },
    { name:"Lionel Messi", sport:"Soccer", league:"MLS", status:"Active", era:"2004-pres", team:"Inter Miami", stat:"850", statLabel:"Career Goals (all comps)", role:"Forward", icon:"⚽" },
    { name:"Marta", sport:"Soccer", league:"NWSL", status:"Active", era:"2001-pres", team:"Orlando Pride", stat:"6", statLabel:"World Player of Year Awards", role:"Forward", icon:"⚽" },
  ]},
  11: { tier:TIER.LEGEND, players:[
    { name:"Mark Messier", sport:"NHL", league:"NHL", status:"Retired", era:"1979-2004", team:"Edmonton Oilers - NY Rangers", stat:"6", statLabel:"Stanley Cup Rings", role:"Center", icon:"🏒" },
    { name:"Isiah Thomas", sport:"NBA", league:"NBA", status:"Retired", era:"1981-1994", team:"Detroit Pistons", stat:"2", statLabel:"Championships", role:"Point Guard", icon:"🏀" },
    { name:"Carl Hubbell", sport:"MLB", league:"MLB", status:"Retired", era:"1928-1943", team:"New York Giants", stat:"253", statLabel:"Career Wins", role:"Pitcher", icon:"⚾" },
    { name:"Ronaldinho", sport:"Soccer", league:"La Liga", status:"Retired", era:"1998-2015", team:"FC Barcelona", stat:"229", statLabel:"Club Goals", role:"Forward/AM", icon:"⚽" },
    { name:"Caitlin Clark", sport:"NBA", league:"WNBA", status:"Active", era:"2024-pres", team:"Indiana Fever", stat:"895", statLabel:"College Points (record)", role:"Point Guard", icon:"🏀" },
  ]},
  12: { tier:TIER.LEGEND, players:[
    { name:"Roger Staubach", sport:"NFL", league:"NFL", status:"Retired", era:"1969-1979", team:"Dallas Cowboys", stat:"2", statLabel:"Super Bowl Wins", role:"Quarterback", icon:"🏈" },
    { name:"Joe Namath", sport:"NFL", league:"NFL", status:"Retired", era:"1965-1977", team:"New York Jets", stat:"1", statLabel:"Super Bowl Win", role:"Quarterback", icon:"🏈" },
    { name:"John Stockton", sport:"NBA", league:"NBA", status:"Retired", era:"1984-2003", team:"Utah Jazz", stat:"15806", statLabel:"Career Assists (record)", role:"Point Guard", icon:"🏀" },
    { name:"Tom Brady", sport:"NFL", league:"NFL", status:"Retired", era:"2000-2022", team:"New England Patriots - Tampa Bay Buccaneers", stat:"7", statLabel:"Super Bowl Wins", role:"Quarterback", icon:"🏈" },
  ]},
  13: { tier:TIER.LEGEND, players:[
    { name:"Dan Marino", sport:"NFL", league:"NFL", status:"Retired", era:"1983-1999", team:"Miami Dolphins", stat:"420", statLabel:"TD Passes", role:"Quarterback", icon:"🏈" },
    { name:"Wilt Chamberlain", sport:"NBA", league:"NBA", status:"Retired", era:"1959-1973", team:"Philadelphia 76ers", stat:"100", statLabel:"Points in One Game", role:"Center", icon:"🏀" },
    { name:"Alex Rodriguez", sport:"MLB", league:"MLB", status:"Retired", era:"1994-2016", team:"New York Yankees", stat:"696", statLabel:"Career Home Runs", role:"Shortstop / 3B", icon:"⚾" },
    { name:"Mats Sundin", sport:"NHL", league:"NHL", status:"Retired", era:"1990-2009", team:"Toronto Maple Leafs", stat:"564", statLabel:"Career Goals", role:"Center", icon:"🏒" },
  ]},
  14: { tier:TIER.LEGEND, players:[
    { name:"Pete Rose", sport:"MLB", league:"MLB", status:"Retired", era:"1963-1986", team:"Cincinnati Reds", stat:"4256", statLabel:"Career Hits (record)", role:"Outfield / 3B", icon:"⚾" },
    { name:"Thierry Henry", sport:"Soccer", league:"Premier League", status:"Retired", era:"1994-2012", team:"Arsenal - Barcelona", stat:"360", statLabel:"Club Goals", role:"Striker", icon:"⚽" },
    { name:"Bob Cousy", sport:"NBA", league:"NBA", status:"Retired", era:"1950-1963", team:"Boston Celtics", stat:"6", statLabel:"Championships", role:"Point Guard", icon:"🏀" },
  ]},
  15: { tier:TIER.LEGEND, players:[
    { name:"Bart Starr", sport:"NFL", league:"NFL", status:"Retired", era:"1956-1971", team:"Green Bay Packers", stat:"2", statLabel:"Super Bowl Wins", role:"Quarterback", icon:"🏈" },
    { name:"Thurman Thomas", sport:"NFL", league:"NFL", status:"Retired", era:"1988-2000", team:"Buffalo Bills", stat:"4", statLabel:"AFC Championships", role:"Running Back", icon:"🏈" },
    { name:"Carmelo Anthony", sport:"NBA", league:"NBA", status:"Retired", era:"2003-2022", team:"New York Knicks", stat:"28289", statLabel:"Career Points", role:"Small Forward", icon:"🏀" },
    { name:"Patrick Mahomes", sport:"NFL", league:"NFL", status:"Active", era:"2017-pres", team:"Kansas City Chiefs", stat:"3", statLabel:"Super Bowl Wins", role:"Quarterback", icon:"🏈" },
  ]},
  16: { tier:TIER.LEGEND, players:[
    { name:"Joe Montana", sport:"NFL", league:"NFL", status:"Retired", era:"1979-1994", team:"San Francisco 49ers", stat:"4", statLabel:"Super Bowl Wins", role:"Quarterback", icon:"🏈" },
    { name:"Trevor Linden", sport:"NHL", league:"NHL", status:"Retired", era:"1988-2008", team:"Vancouver Canucks", stat:"375", statLabel:"Career Goals", role:"Center", icon:"🏒" },
  ]},
  17: { tier:TIER.LEGEND, players:[
    { name:"Dizzy Dean", sport:"MLB", league:"MLB", status:"Retired", era:"1930-1947", team:"St. Louis Cardinals", stat:"30", statLabel:"Season Wins", role:"Pitcher", icon:"⚾" },
    { name:"Cam Newton", sport:"NFL", league:"NFL", status:"Retired", era:"2011-2021", team:"Carolina Panthers", stat:"1", statLabel:"MVP Award", role:"Quarterback", icon:"🏈" },
    { name:"Kylian Mbappe", sport:"Soccer", league:"La Liga", status:"Active", era:"2016-pres", team:"Real Madrid", stat:"300", statLabel:"Club Goals", role:"Forward", icon:"⚽" },
  ]},
  18: { tier:TIER.LEGEND, players:[
    { name:"Peyton Manning", sport:"NFL", league:"NFL", status:"Retired", era:"1998-2015", team:"Indianapolis Colts - Denver Broncos", stat:"2", statLabel:"Super Bowl Wins", role:"Quarterback", icon:"🏈" },
    { name:"Denis Savard", sport:"NHL", league:"NHL", status:"Retired", era:"1980-1997", team:"Chicago Blackhawks", stat:"473", statLabel:"Career Goals", role:"Center", icon:"🏒" },
  ]},
  19: { tier:TIER.LEGEND, players:[
    { name:"Johnny Unitas", sport:"NFL", league:"NFL", status:"Retired", era:"1956-1973", team:"Baltimore Colts", stat:"290", statLabel:"TD Passes", role:"Quarterback", icon:"🏈" },
    { name:"Joe Sakic", sport:"NHL", league:"NHL", status:"Retired", era:"1988-2009", team:"Quebec Nordiques", stat:"625", statLabel:"Career Goals", role:"Center", icon:"🏒" },
    { name:"Tony Gwynn", sport:"MLB", league:"MLB", status:"Retired", era:"1982-2001", team:"San Diego Padres", stat:".338", statLabel:"Career Batting AVG", role:"Right Field", icon:"⚾" },
  ]},
  20: { tier:TIER.LEGEND, players:[
    { name:"Mike Schmidt", sport:"MLB", league:"MLB", status:"Retired", era:"1972-1989", team:"Philadelphia Phillies", stat:"548", statLabel:"Career Home Runs", role:"Third Base", icon:"⚾" },
    { name:"Ed Belfour", sport:"NHL", league:"NHL", status:"Retired", era:"1988-2007", team:"Chicago Blackhawks", stat:"484", statLabel:"Career Wins", role:"Goaltender", icon:"🏒" },
    { name:"Barry Sanders", sport:"NFL", league:"NFL", status:"Retired", era:"1989-1998", team:"Detroit Lions", stat:"15269", statLabel:"Career Rushing Yards", role:"Running Back", icon:"🏈" },
    { name:"Sam Kerr", sport:"Soccer", league:"WSL", status:"Active", era:"2009-pres", team:"Chelsea FC Women", stat:"68", statLabel:"Australia Goals (record)", role:"Striker", icon:"⚽" },
  ]},
  21: { tier:TIER.LEGEND, players:[
    { name:"Tim Duncan", sport:"NBA", league:"NBA", status:"Retired", era:"1997-2016", team:"San Antonio Spurs", stat:"5", statLabel:"Championships", role:"Power Forward", icon:"🏀" },
    { name:"Roberto Clemente", sport:"MLB", league:"MLB", status:"Retired", era:"1955-1972", team:"Pittsburgh Pirates", stat:"3000", statLabel:"Career Hits (exactly)", role:"Right Field", icon:"⚾" },
    { name:"Dominik Hasek", sport:"NHL", league:"NHL", status:"Retired", era:"1990-2008", team:"Buffalo Sabres", stat:"6", statLabel:"Vezina Trophies", role:"Goaltender", icon:"🏒" },
    { name:"Hilary Knight", sport:"NHL", league:"PWHL", status:"Active", era:"2012-pres", team:"Boston Fleet", stat:"7", statLabel:"World Championship Golds", role:"Forward", icon:"🏒" },
  ]},
  22: { tier:TIER.LEGEND, players:[
    { name:"Jim Palmer", sport:"MLB", league:"MLB", status:"Retired", era:"1965-1984", team:"Baltimore Orioles", stat:"268", statLabel:"Career Wins", role:"Pitcher", icon:"⚾" },
    { name:"Mike Bossy", sport:"NHL", league:"NHL", status:"Retired", era:"1977-1987", team:"New York Islanders", stat:"573", statLabel:"Career Goals", role:"Right Wing", icon:"🏒" },
    { name:"Emmitt Smith", sport:"NFL", league:"NFL", status:"Retired", era:"1990-2004", team:"Dallas Cowboys", stat:"18355", statLabel:"Career Rushing Yards (record)", role:"Running Back", icon:"🏈" },
    { name:"Clyde Drexler", sport:"NBA", league:"NBA", status:"Retired", era:"1983-1998", team:"Portland Trail Blazers", stat:"22195", statLabel:"Career Points", role:"Shooting Guard", icon:"🏀" },
    { name:"A'ja Wilson", sport:"NBA", league:"WNBA", status:"Active", era:"2018-pres", team:"Las Vegas Aces", stat:"3", statLabel:"WNBA Championships", role:"Forward", icon:"🏀" },
  ]},
  23: { tier:TIER.SACRED, sacredSport:"NBA", players:[
    { name:"Michael Jordan", sport:"NBA", league:"NBA", status:"Retired", era:"1984-2003", team:"Chicago Bulls", stat:"6", statLabel:"Championships", role:"Shooting Guard", icon:"🏀" },
    { name:"David Beckham", sport:"Soccer", league:"Premier League / La Liga", status:"Retired", era:"1992-2013", team:"Manchester United - Real Madrid", stat:"127", statLabel:"Career Goals", role:"Midfielder", icon:"⚽" },
    { name:"Maya Moore", sport:"NBA", league:"WNBA", status:"Retired", era:"2011-2023", team:"Minnesota Lynx", stat:"4", statLabel:"WNBA Championships", role:"Forward", icon:"🏀" },
    { name:"LeBron James", sport:"NBA", league:"NBA", status:"Active", era:"2003-pres", team:"Los Angeles Lakers", stat:"40000", statLabel:"Career Points (record)", role:"Small Forward", icon:"🏀" },
  ]},
  24: { tier:TIER.LEGEND, players:[
    { name:"Willie Mays", sport:"MLB", league:"MLB", status:"Retired", era:"1951-1973", team:"New York Giants", stat:"660", statLabel:"Career Home Runs", role:"Center Field", icon:"⚾" },
    { name:"Kobe Bryant", sport:"NBA", league:"NBA", status:"Retired", era:"1996-2016", team:"Los Angeles Lakers", stat:"33643", statLabel:"Career Points", role:"Shooting Guard", icon:"🏀" },
  ]},
  25: { tier:TIER.LEGEND, players:[
    { name:"Barry Bonds", sport:"MLB", league:"MLB", status:"Retired", era:"1986-2007", team:"San Francisco Giants", stat:"762", statLabel:"Career Home Runs (record)", role:"Left Field", icon:"⚾" },
    { name:"Mark Recchi", sport:"NHL", league:"NHL", status:"Retired", era:"1988-2011", team:"Pittsburgh Penguins", stat:"1533", statLabel:"Career Points", role:"Right Wing", icon:"🏒" },
  ]},
  26: { tier:TIER.LEGEND, players:[
    { name:"Rod Carew", sport:"MLB", league:"MLB", status:"Retired", era:"1967-1985", team:"Minnesota Twins", stat:".328", statLabel:"Career Batting AVG", role:"First Base / 2B", icon:"⚾" },
    { name:"Patrice Bergeron", sport:"NHL", league:"NHL", status:"Retired", era:"2003-2023", team:"Boston Bruins", stat:"6", statLabel:"Selke Trophies", role:"Center", icon:"🏒" },
  ]},
  27: { tier:TIER.LEGEND, players:[
    { name:"Vladimir Guerrero", sport:"MLB", league:"MLB", status:"Retired", era:"1996-2011", team:"Montreal Expos", stat:"449", statLabel:"Career Home Runs", role:"Right Field", icon:"⚾" },
  ]},
  28: { tier:TIER.LEGEND, players:[
    { name:"Jaromir Jagr", sport:"NHL", league:"NHL", status:"Retired", era:"1990-2018", team:"Pittsburgh Penguins", stat:"766", statLabel:"Career Goals", role:"Right Wing", icon:"🏒" },
    { name:"Marshall Faulk", sport:"NFL", league:"NFL", status:"Retired", era:"1994-2005", team:"St. Louis Rams", stat:"12279", statLabel:"Career Rushing Yards", role:"Running Back", icon:"🏈" },
  ]},
  29: { tier:TIER.LEGEND, players:[
    { name:"Rod Langway", sport:"NHL", league:"NHL", status:"Retired", era:"1977-1993", team:"Washington Capitals", stat:"2", statLabel:"Norris Trophies", role:"Defenseman", icon:"🏒" },
    { name:"Sarah Nurse", sport:"NHL", league:"PWHL", status:"Active", era:"2023-pres", team:"Montreal Victoire", stat:"18", statLabel:"2022 Olympic Points (record)", role:"Forward", icon:"🏒" },
  ]},
  30: { tier:TIER.LEGEND, players:[
    { name:"Martin Brodeur", sport:"NHL", league:"NHL", status:"Retired", era:"1991-2015", team:"New Jersey Devils", stat:"691", statLabel:"Career Wins (record)", role:"Goaltender", icon:"🏒" },
    { name:"Stephen Curry", sport:"NBA", league:"NBA", status:"Active", era:"2009-pres", team:"Golden State Warriors", stat:"4", statLabel:"Championships", role:"Point Guard", icon:"🏀" },
    { name:"Breanna Stewart", sport:"NBA", league:"WNBA", status:"Active", era:"2016-pres", team:"New York Liberty", stat:"2", statLabel:"WNBA Championships", role:"Forward", icon:"🏀" },
  ]},
  31: { tier:TIER.LEGEND, players:[
    { name:"Mike Piazza", sport:"MLB", league:"MLB", status:"Retired", era:"1992-2007", team:"New York Mets", stat:"396", statLabel:"Home Runs (C record)", role:"Catcher", icon:"⚾" },
    { name:"Grant Fuhr", sport:"NHL", league:"NHL", status:"Retired", era:"1981-2000", team:"Edmonton Oilers", stat:"5", statLabel:"Stanley Cup Rings", role:"Goaltender", icon:"🏒" },
  ]},
  32: { tier:TIER.LEGEND, players:[
    { name:"Sandy Koufax", sport:"MLB", league:"MLB", status:"Retired", era:"1955-1966", team:"Los Angeles Dodgers", stat:"4", statLabel:"ERA Titles", role:"Pitcher", icon:"⚾" },
    { name:"Magic Johnson", sport:"NBA", league:"NBA", status:"Retired", era:"1979-1996", team:"Los Angeles Showtime Lakers", stat:"5", statLabel:"Championships", role:"Point Guard", icon:"🏀" },
    { name:"Jim Brown", sport:"NFL", league:"NFL", status:"Retired", era:"1957-1965", team:"Cleveland Browns", stat:"12", statLabel:"Career Rushing AVG", role:"Running Back", icon:"🏈" },
  ]},
  33: { tier:TIER.LEGEND, players:[
    { name:"Larry Bird", sport:"NBA", league:"NBA", status:"Retired", era:"1979-1992", team:"Boston Celtics", stat:"3", statLabel:"Championships", role:"Small Forward", icon:"🏀" },
    { name:"Patrick Roy", sport:"NHL", league:"NHL", status:"Retired", era:"1984-2003", team:"Montreal Canadiens - Colorado Avalanche", stat:"4", statLabel:"Stanley Cup Rings", role:"Goaltender", icon:"🏒" },
    { name:"Kareem Abdul-Jabbar", sport:"NBA", league:"NBA", status:"Retired", era:"1969-1989", team:"Los Angeles Lakers", stat:"38387", statLabel:"Career Points (former record)", role:"Center", icon:"🏀" },
  ]},
  34: { tier:TIER.LEGEND, players:[
    { name:"Walter Payton", sport:"NFL", league:"NFL", status:"Retired", era:"1975-1987", team:"Chicago Bears", stat:"16726", statLabel:"Career Rushing Yards", role:"Running Back", icon:"🏈" },
    { name:"Nolan Ryan", sport:"MLB", league:"MLB", status:"Retired", era:"1966-1993", team:"Texas Rangers", stat:"5714", statLabel:"Career Strikeouts", role:"Pitcher", icon:"⚾" },
    { name:"Charles Barkley", sport:"NBA", league:"NBA", status:"Retired", era:"1984-2000", team:"Philadelphia 76ers", stat:"1", statLabel:"MVP Award", role:"Power Forward", icon:"🏀" },
  ]},
  35: { tier:TIER.LEGEND, players:[
    { name:"Frank Thomas", sport:"MLB", league:"MLB", status:"Retired", era:"1990-2008", team:"Chicago White Sox", stat:"521", statLabel:"Career Home Runs", role:"First Base", icon:"⚾" },
    { name:"Phil Niekro", sport:"MLB", league:"MLB", status:"Retired", era:"1964-1987", team:"Atlanta Braves", stat:"318", statLabel:"Career Wins", role:"Pitcher", icon:"⚾" },
  ]},
  36: { tier:TIER.LEGEND, players:[
    { name:"Robin Roberts", sport:"MLB", league:"MLB", status:"Retired", era:"1948-1966", team:"Philadelphia Phillies", stat:"286", statLabel:"Career Wins", role:"Pitcher", icon:"⚾" },
    { name:"Jerome Bettis", sport:"NFL", league:"NFL", status:"Retired", era:"1993-2005", team:"Pittsburgh Steelers", stat:"13662", statLabel:"Career Rushing Yards", role:"Running Back", icon:"🏈" },
  ]},
  37: { tier:TIER.LEGEND, players:[
    { name:"Casey Stengel", sport:"MLB", league:"MLB", status:"Retired", era:"1934-1965", team:"New York Yankees", stat:"7", statLabel:"World Series Titles (manager)", role:"Manager", icon:"⚾" },
  ]},
  38: { tier:TIER.LEGEND, players:[
    { name:"Curt Schilling", sport:"MLB", league:"MLB", status:"Retired", era:"1988-2007", team:"Boston Red Sox", stat:"216", statLabel:"Career Wins", role:"Pitcher", icon:"⚾" },
  ]},
  39: { tier:TIER.LEGEND, players:[
    { name:"Roy Campanella", sport:"MLB", league:"MLB", status:"Retired", era:"1948-1957", team:"Brooklyn Dodgers", stat:"3", statLabel:"MVP Awards", role:"Catcher", icon:"⚾" },
    { name:"Dominique Wilkins", sport:"NBA", league:"NBA", status:"Retired", era:"1982-1999", team:"Atlanta Hawks", stat:"26668", statLabel:"Career Points", role:"Small Forward", icon:"🏀" },
  ]},
  40: { tier:TIER.LEGEND, players:[
    { name:"Gale Sayers", sport:"NFL", league:"NFL", status:"Retired", era:"1965-1971", team:"Chicago Bears", stat:"22", statLabel:"Career Touchdowns", role:"Running Back", icon:"🏈" },
    { name:"Pat Tillman", sport:"NFL", league:"NFL", status:"Retired", era:"1998-2002", team:"Arizona Cardinals", stat:"226", statLabel:"Career Tackles", role:"Safety", icon:"🏈" },
  ]},
  41: { tier:TIER.LEGEND, players:[
    { name:"Dirk Nowitzki", sport:"NBA", league:"NBA", status:"Retired", era:"1998-2019", team:"Dallas Mavericks", stat:"31560", statLabel:"Career Points", role:"Power Forward", icon:"🏀" },
  ]},
  42: { tier:TIER.SACRED, sacredSport:"MLB", players:[
    { name:"Jackie Robinson", sport:"MLB", league:"MLB", status:"Retired", era:"1947-1956", team:"Brooklyn Dodgers", stat:"6", statLabel:"Stolen Base Titles", role:"Second Base", icon:"⚾" },
  ]},
  43: { tier:TIER.LEGEND, players:[
    { name:"Troy Polamalu", sport:"NFL", league:"NFL", status:"Retired", era:"2003-2014", team:"Pittsburgh Steelers", stat:"32", statLabel:"Career Interceptions", role:"Safety", icon:"🏈" },
  ]},
  44: { tier:TIER.LEGEND, players:[
    { name:"Hank Aaron", sport:"MLB", league:"MLB", status:"Retired", era:"1954-1976", team:"Atlanta Braves", stat:"755", statLabel:"Career Home Runs", role:"Right Field", icon:"⚾" },
    { name:"Jerry West", sport:"NBA", league:"NBA", status:"Retired", era:"1960-1974", team:"Los Angeles Lakers", stat:"25192", statLabel:"Career Points", role:"Guard", icon:"🏀" },
    { name:"Floyd Little", sport:"NFL", league:"NFL", status:"Retired", era:"1967-1975", team:"Denver Broncos", stat:"6323", statLabel:"Career Rushing Yards", role:"Running Back", icon:"🏈" },
  ]},
  45: { tier:TIER.LEGEND, players:[
    { name:"Bob Gibson", sport:"MLB", league:"MLB", status:"Retired", era:"1959-1975", team:"St. Louis Cardinals", stat:"1.12", statLabel:"1968 ERA", role:"Pitcher", icon:"⚾" },
  ]},
  46: { tier:TIER.LEGEND, players:[
    { name:"Andy Pettitte", sport:"MLB", league:"MLB", status:"Retired", era:"1995-2013", team:"New York Yankees", stat:"256", statLabel:"Career Wins", role:"Pitcher", icon:"⚾" },
  ]},
  47: { tier:TIER.UNWRITTEN, players:[] },
  48: { tier:TIER.UNWRITTEN, players:[] },
  49: { tier:TIER.UNWRITTEN, players:[] },
  50: { tier:TIER.LEGEND, players:[
    { name:"Mike Singletary", sport:"NFL", league:"NFL", status:"Retired", era:"1981-1992", team:"Chicago Bears", stat:"1", statLabel:"Defensive MVP", role:"Linebacker", icon:"🏈" },
    { name:"David Robinson", sport:"NBA", league:"NBA", status:"Retired", era:"1989-2003", team:"San Antonio Spurs", stat:"2", statLabel:"Championships", role:"Center", icon:"🏀" },
  ]},
  51: { tier:TIER.LEGEND, players:[
    { name:"Dick Butkus", sport:"NFL", league:"NFL", status:"Retired", era:"1965-1973", team:"Chicago Bears", stat:"22", statLabel:"Career Interceptions", role:"Linebacker", icon:"🏈" },
    { name:"Bernie Williams", sport:"MLB", league:"MLB", status:"Retired", era:"1991-2006", team:"New York Yankees", stat:"2336", statLabel:"Career Hits", role:"Center Field", icon:"⚾" },
  ]},
  52: { tier:TIER.LEGEND, players:[
    { name:"Mike Webster", sport:"NFL", league:"NFL", status:"Retired", era:"1974-1990", team:"Pittsburgh Steelers", stat:"4", statLabel:"Super Bowl Rings", role:"Center", icon:"🏈" },
    { name:"Ray Lewis", sport:"NFL", league:"NFL", status:"Retired", era:"1996-2012", team:"Baltimore Ravens", stat:"2", statLabel:"Super Bowl Wins", role:"Linebacker", icon:"🏈" },
  ]},
  53: { tier:TIER.LEGEND, players:[
    { name:"Mel Blount", sport:"NFL", league:"NFL", status:"Retired", era:"1970-1983", team:"Pittsburgh Steelers", stat:"57", statLabel:"Career Interceptions", role:"Cornerback", icon:"🏈" },
  ]},
  54: { tier:TIER.LEGEND, players:[
    { name:"Brian Urlacher", sport:"NFL", league:"NFL", status:"Retired", era:"2000-2012", team:"Chicago Bears", stat:"1", statLabel:"Defensive Player of Year", role:"Linebacker", icon:"🏈" },
  ]},
  55: { tier:TIER.LEGEND, players:[
    { name:"Junior Seau", sport:"NFL", league:"NFL", status:"Retired", era:"1990-2009", team:"San Diego Chargers", stat:"56", statLabel:"Career Sacks", role:"Linebacker", icon:"🏈" },
    { name:"Dikembe Mutombo", sport:"NBA", league:"NBA", status:"Retired", era:"1991-2009", team:"Denver Nuggets", stat:"3289", statLabel:"Career Blocks", role:"Center", icon:"🏀" },
  ]},
  56: { tier:TIER.LEGEND, players:[
    { name:"Lawrence Taylor", sport:"NFL", league:"NFL", status:"Retired", era:"1981-1993", team:"New York Giants", stat:"132", statLabel:"Career Sacks", role:"Linebacker", icon:"🏈" },
  ]},
  57: { tier:TIER.LEGEND, players:[
    { name:"Tedy Bruschi", sport:"NFL", league:"NFL", status:"Retired", era:"1996-2008", team:"New England Patriots", stat:"3", statLabel:"Super Bowl Rings", role:"Linebacker", icon:"🏈" },
  ]},
  58: { tier:TIER.LEGEND, players:[
    { name:"Derrick Thomas", sport:"NFL", league:"NFL", status:"Retired", era:"1989-1999", team:"Kansas City Chiefs", stat:"126", statLabel:"Career Sacks", role:"Linebacker", icon:"🏈" },
  ]},
  59: { tier:TIER.UNWRITTEN, players:[] },
  60: { tier:TIER.UNWRITTEN, players:[] },
  61: { tier:TIER.UNWRITTEN, players:[] },
  62: { tier:TIER.UNWRITTEN, players:[] },
  63: { tier:TIER.UNWRITTEN, players:[] },
  64: { tier:TIER.UNWRITTEN, players:[] },
  65: { tier:TIER.UNWRITTEN, players:[] },
  66: { tier:TIER.LEGEND, players:[
    { name:"Mario Lemieux", sport:"NHL", league:"NHL", status:"Retired", era:"1984-2006", team:"Pittsburgh Penguins", stat:"690", statLabel:"Career Goals", role:"Center", icon:"🏒" },
    { name:"Ray Nitschke", sport:"NFL", league:"NFL", status:"Retired", era:"1958-1972", team:"Green Bay Packers", stat:"3", statLabel:"NFL Championships", role:"Linebacker", icon:"🏈" },
  ]},
  67: { tier:TIER.UNWRITTEN, players:[] },
  68: { tier:TIER.UNWRITTEN, players:[] },
  69: { tier:TIER.UNWRITTEN, players:[] },
  70: { tier:TIER.UNWRITTEN, players:[] },
  71: { tier:TIER.UNWRITTEN, players:[] },
  72: { tier:TIER.UNWRITTEN, players:[] },
  73: { tier:TIER.LEGEND, players:[
    { name:"John Hannah", sport:"NFL", league:"NFL", status:"Retired", era:"1973-1985", team:"New England Patriots", stat:"9", statLabel:"Pro Bowl Selections", role:"Offensive Guard", icon:"🏈" },
  ]},
  74: { tier:TIER.LEGEND, players:[
    { name:"Merlin Olsen", sport:"NFL", league:"NFL", status:"Retired", era:"1962-1976", team:"Los Angeles Rams", stat:"14", statLabel:"Pro Bowl Selections", role:"Defensive Tackle", icon:"🏈" },
    { name:"Bob Lilly", sport:"NFL", league:"NFL", status:"Retired", era:"1961-1974", team:"Dallas Cowboys", stat:"1", statLabel:"Super Bowl Ring", role:"Defensive Tackle", icon:"🏈" },
  ]},
  75: { tier:TIER.LEGEND, players:[
    { name:"Deacon Jones", sport:"NFL", league:"NFL", status:"Retired", era:"1961-1974", team:"Los Angeles Rams", stat:"173.5", statLabel:"Career Sacks (unofficial)", role:"Defensive End", icon:"🏈" },
    { name:"Joe Greene", sport:"NFL", league:"NFL", status:"Retired", era:"1969-1981", team:"Pittsburgh Steelers", stat:"4", statLabel:"Super Bowl Rings", role:"Defensive Tackle", icon:"🏈" },
  ]},
  76: { tier:TIER.LEGEND, players:[
    { name:"Lou Groza", sport:"NFL", league:"NFL", status:"Retired", era:"1946-1967", team:"Cleveland Browns", stat:"1608", statLabel:"Career Kicking Points", role:"Kicker / OT", icon:"🏈" },
  ]},
  77: { tier:TIER.LEGEND, players:[
    { name:"Red Grange", sport:"NFL", league:"NFL", status:"Retired", era:"1925-1934", team:"Chicago Bears", stat:"1925", statLabel:"Year He Made Pro Football Legitimate", role:"Halfback", icon:"🏈" },
    { name:"Ray Bourque", sport:"NHL", league:"NHL", status:"Retired", era:"1979-2001", team:"Boston Bruins - Colorado Avalanche", stat:"1169", statLabel:"Career Points (D record)", role:"Defenseman", icon:"🏒" },
    { name:"Luca Doncic", sport:"NBA", league:"NBA", status:"Active", era:"2018-pres", team:"Dallas Mavericks", stat:"29.4", statLabel:"Career PPG", role:"Guard/Forward", icon:"🏀" },
  ]},
  78: { tier:TIER.LEGEND, players:[
    { name:"Anthony Munoz", sport:"NFL", league:"NFL", status:"Retired", era:"1980-1992", team:"Cincinnati Bengals", stat:"11", statLabel:"Pro Bowl Selections", role:"Offensive Tackle", icon:"🏈" },
  ]},
  79: { tier:TIER.UNWRITTEN, players:[] },
  80: { tier:TIER.LEGEND, players:[
    { name:"Jerry Rice", sport:"NFL", league:"NFL", status:"Retired", era:"1985-2004", team:"San Francisco 49ers", stat:"197", statLabel:"Career Receiving TDs (record)", role:"Wide Receiver", icon:"🏈" },
    { name:"Cris Carter", sport:"NFL", league:"NFL", status:"Retired", era:"1987-2002", team:"Minnesota Vikings", stat:"130", statLabel:"Career TDs", role:"Wide Receiver", icon:"🏈" },
  ]},
  81: { tier:TIER.LEGEND, players:[
    { name:"Terrell Owens", sport:"NFL", league:"NFL", status:"Retired", era:"1996-2010", team:"San Francisco 49ers", stat:"153", statLabel:"Career Receiving TDs", role:"Wide Receiver", icon:"🏈" },
    { name:"Tim Brown", sport:"NFL", league:"NFL", status:"Retired", era:"1988-2004", team:"Los Angeles Raiders", stat:"1094", statLabel:"Career Receptions", role:"Wide Receiver", icon:"🏈" },
  ]},
  82: { tier:TIER.LEGEND, players:[
    { name:"Reggie Wayne", sport:"NFL", league:"NFL", status:"Retired", era:"2001-2016", team:"Indianapolis Colts", stat:"1070", statLabel:"Career Receptions", role:"Wide Receiver", icon:"🏈" },
  ]},
  83: { tier:TIER.LEGEND, players:[
    { name:"Andre Johnson", sport:"NFL", league:"NFL", status:"Retired", era:"2003-2016", team:"Houston Texans", stat:"1062", statLabel:"Career Receptions", role:"Wide Receiver", icon:"🏈" },
  ]},
  84: { tier:TIER.LEGEND, players:[
    { name:"Randy Moss", sport:"NFL", league:"NFL", status:"Retired", era:"1998-2012", team:"Minnesota Vikings", stat:"23", statLabel:"Single Season TDs (record)", role:"Wide Receiver", icon:"🏈" },
    { name:"Shannon Sharpe", sport:"NFL", league:"NFL", status:"Retired", era:"1990-2003", team:"Denver Broncos", stat:"3", statLabel:"Super Bowl Rings", role:"Tight End", icon:"🏈" },
  ]},
  85: { tier:TIER.LEGEND, players:[
    { name:"Chad Johnson", sport:"NFL", league:"NFL", status:"Retired", era:"2001-2012", team:"Cincinnati Bengals", stat:"1058", statLabel:"Career Receptions", role:"Wide Receiver", icon:"🏈" },
  ]},
  86: { tier:TIER.LEGEND, players:[
    { name:"Hines Ward", sport:"NFL", league:"NFL", status:"Retired", era:"1998-2011", team:"Pittsburgh Steelers", stat:"2", statLabel:"Super Bowl Rings", role:"Wide Receiver", icon:"🏈" },
  ]},
  87: { tier:TIER.RISING, players:[
    { name:"Rob Gronkowski", sport:"NFL", league:"NFL", status:"Retired", era:"2010-2022", team:"New England Patriots - Tampa Bay Buccaneers", stat:"4", statLabel:"Super Bowl Rings", role:"Tight End", icon:"🏈" },
    { name:"Travis Kelce", sport:"NFL", league:"NFL", status:"Active", era:"2013-pres", team:"Kansas City Chiefs", stat:"3", statLabel:"Super Bowl Wins", role:"Tight End", icon:"🏈" },
  ]},
  88: { tier:TIER.LEGEND, players:[
    { name:"Eric Lindros", sport:"NHL", league:"NHL", status:"Retired", era:"1992-2007", team:"Philadelphia Flyers", stat:"372", statLabel:"Career Goals", role:"Center", icon:"🏒" },
    { name:"Tony Gonzalez", sport:"NFL", league:"NFL", status:"Retired", era:"1997-2013", team:"Kansas City Chiefs", stat:"1325", statLabel:"Career Receptions", role:"Tight End", icon:"🏈" },
    { name:"Lynn Swann", sport:"NFL", league:"NFL", status:"Retired", era:"1974-1982", team:"Pittsburgh Steelers", stat:"4", statLabel:"Super Bowl Rings", role:"Wide Receiver", icon:"🏈" },
  ]},
  89: { tier:TIER.LEGEND, players:[
    { name:"Mike Ditka", sport:"NFL", league:"NFL", status:"Retired", era:"1961-1972", team:"Chicago Bears", stat:"427", statLabel:"Career Receptions", role:"Tight End", icon:"🏈" },
    { name:"Wes Welker", sport:"NFL", league:"NFL", status:"Retired", era:"2004-2015", team:"New England Patriots", stat:"903", statLabel:"Career Receptions", role:"Wide Receiver / Slot", icon:"🏈" },
  ]},
  90: { tier:TIER.UNWRITTEN, players:[] },
  91: { tier:TIER.LEGEND, players:[
    { name:"Dennis Rodman", sport:"NBA", league:"NBA", status:"Retired", era:"1986-2000", team:"Detroit Pistons - Chicago Bulls", stat:"5", statLabel:"Championships", role:"Power Forward", icon:"🏀" },
  ]},
  92: { tier:TIER.LEGEND, players:[
    { name:"Michael Strahan", sport:"NFL", league:"NFL", status:"Retired", era:"2004-2007", team:"New York Giants", stat:"22.5", statLabel:"Single Season Sacks (record)", role:"Defensive End", icon:"🏈" },
  ]},
  93: { tier:TIER.LEGEND, players:[
    { name:"Reggie White", sport:"NFL", league:"NFL", status:"Retired", era:"1985-2000", team:"Philadelphia Eagles - Green Bay Packers", stat:"198", statLabel:"Career Sacks", role:"Defensive End", icon:"🏈" },
  ]},
  94: { tier:TIER.LEGEND, players:[
    { name:"Charles Haley", sport:"NFL", league:"NFL", status:"Retired", era:"1986-1999", team:"San Francisco 49ers - Dallas Cowboys", stat:"5", statLabel:"Super Bowl Rings", role:"Defensive End", icon:"🏈" },
  ]},
  95: { tier:TIER.LEGEND, players:[
    { name:"Richard Dent", sport:"NFL", league:"NFL", status:"Retired", era:"1983-1997", team:"Chicago Bears", stat:"137", statLabel:"Career Sacks", role:"Defensive End", icon:"🏈" },
  ]},
  96: { tier:TIER.LEGEND, players:[
    { name:"Cortez Kennedy", sport:"NFL", league:"NFL", status:"Retired", era:"1990-2000", team:"Seattle Seahawks", stat:"1", statLabel:"Defensive Player of Year", role:"Defensive Tackle", icon:"🏈" },
  ]},
  97: { tier:TIER.RISING, players:[
    { name:"Megan Rapinoe", sport:"Soccer", league:"NWSL", status:"Retired", era:"2009-2023", team:"OL Reign", stat:"2", statLabel:"World Cup Wins", role:"Winger", icon:"⚽" },
    { name:"Connor McDavid", sport:"NHL", league:"NHL", status:"Active", era:"2015-pres", team:"Edmonton Oilers", stat:"4", statLabel:"Hart Trophies", role:"Center", icon:"🏒" },
  ]},
  98: { tier:TIER.UNWRITTEN, players:[] },
  99: { tier:TIER.SACRED, sacredSport:"NHL", players:[
    { name:"Wayne Gretzky", sport:"NHL", league:"NHL", status:"Retired", era:"1979-1999", team:"Edmonton Oilers - Los Angeles Kings", stat:"2857", statLabel:"Career Points (record)", role:"Center", icon:"🏒" },
  ]},
};

// Fill all remaining numbers as UNWRITTEN
for (let i = 1; i <= 99; i++) {
  if (!NUMBER_DATA[i]) NUMBER_DATA[i] = { tier: TIER.UNWRITTEN, players: [] };
}

// --- WRITTEN CARD CONTENT (Sacred + #23 exception) ---------------------------
const CARD_CONTENT = {
  6: {
    intro: "The NBA retired this number across all 30 franchises. No player, ever again.",
    stacks: [{
      name: "Bill Russell", sport: "NBA",
      body: "Bill Russell won 11 NBA championships in 13 seasons. Not 11 trophies. Eleven times his team was the best in the world. He anchored a Boston Celtics dynasty that was the most dominant run in North American pro sports history - and he did it while facing racism that would have broken most people.",
      waitWhat: "The NBA retired #6 league-wide in 2022 - 55 years after his last championship. Russell is the only player in NBA history given that honor. Because some things take time to understand.",
    }],
    sacredLine: "THE ONLY NUMBER THE NBA HAS EVER RETIRED LEAGUE-WIDE",
  },
  23: {
    intro: "The NBA retired this number league-wide. Then bent its own rule for one player.",
    stacks: [
      {
        name: "Michael Jordan", sport: "NBA",
        body: "Six championships. Six Finals MVPs. Five league MVPs. Michael Jordan didn't just win - he made losing feel impossible. The NBA did something it had never done before: retired his number across all 30 franchises, for all time.",
        waitWhat: "Jordan is one of only two players the NBA has ever honored this way. The other is Bill Russell (#6). Two players. Sixty years of basketball. That's it.",
      },
      {
        name: "LeBron James", sport: "NBA",
        connector: "There was just one problem. The greatest player of the next generation had already been wearing #23 his whole career. And he wasn't about to stop.",
        body: "Four championships. Four Finals MVPs. The all-time NBA scoring leader. LeBron James is the argument you make when someone says Jordan is untouchable. The league looked the other way - he's the only player ever granted an exception to a retired number.",
      }
    ],
    sacredLine: "RETIRED LEAGUE-WIDE - WITH ONE DOCUMENTED EXCEPTION",
  },
  42: {
    intro: "The only number retired across all of Major League Baseball.",
    stacks: [{
      name: "Jackie Robinson", sport: "MLB",
      body: "In 1947, Jackie Robinson walked onto a Major League Baseball field and changed the country. Six-time All-Star. 1949 MVP. Rookie of the Year. He walked into a world that didn't want him there - through death threats and hatred - with more dignity than the game deserved. His number isn't retired because of the stats.",
      waitWhat: "In 1997, MLB retired #42 across every team in baseball - the only time a sport has done that for a position player. Every April 15th, every player wears #42. The number belongs to everyone now, and to no one.",
    }],
    sacredLine: "THE ONLY NUMBER RETIRED ACROSS ALL OF MAJOR LEAGUE BASEBALL",
  },
  99: {
    intro: "The only number retired across all of the NHL. Forever.",
    stacks: [{
      name: "Wayne Gretzky", sport: "NHL",
      body: "Wayne Gretzky holds 61 NHL records. If you removed every goal he ever scored, he'd still be the all-time points leader - just from his assists. Nine Hart Trophies. Four Stanley Cups. Over two points per game for his entire career. There is no debate. There's just Gretzky, and then everyone else.",
      waitWhat: "In 1999, the NHL retired #99 across every franchise - no player can ever wear it again. He chose 99 as a kid because all the single digits were taken. A number nobody wanted became the number no one can have.",
    }],
    sacredLine: "THE ONLY NUMBER RETIRED ACROSS ALL OF THE NHL",
  },
};

// --- TIER COLOR SYSTEM --------------------------------------------------------
// Sacred  -> White Ranger: bright white/silver, ice glow, transcendent
// Legend  -> Amber fire: the original heat language
// Rising  -> Electric lime: active, current, alive
// Unwritten -> Dim coal: barely there

const TIER_COLORS = {
  SACRED: {
    bg:     "rgba(220,235,255,0.12)",
    text:   "rgba(230,240,255,0.95)",
    border: "rgba(200,220,255,0.55)",
    glow:   "0 0 18px rgba(200,220,255,0.45), 0 0 36px rgba(180,210,255,0.15)",
    accent: "#C8DCFF",
    badge:  "rgba(200,220,255,0.12)",
  },
  LEGEND: {
    bg:     "rgba(200,50,0,0.45)",
    text:   "rgba(255,150,80,1)",
    border: "rgba(255,80,0,0.55)",
    glow:   "0 0 12px rgba(255,80,0,0.4), 0 0 28px rgba(255,80,0,0.15)",
    accent: "#FF8C42",
    badge:  "rgba(255,80,0,0.12)",
  },
  RISING: {
    bg:     "rgba(80,200,0,0.18)",
    text:   "rgba(160,240,60,0.95)",
    border: "rgba(120,220,20,0.45)",
    glow:   "0 0 12px rgba(120,220,20,0.3), 0 0 24px rgba(120,220,20,0.1)",
    accent: "#8FD920",
    badge:  "rgba(120,220,20,0.1)",
  },
  UNWRITTEN: {
    bg:     "rgba(255,255,255,0.06)",
    text:   "rgba(255,255,255,0.42)",
    border: "rgba(255,255,255,0.22)",
    glow:   "none",
    accent: "rgba(255,255,255,0.2)",
    badge:  "rgba(255,255,255,0.05)",
  },
};

function tierColors(tier, isSelected) {
  if (isSelected) return {
    bg:"rgba(255,255,255,0.15)", text:"#fff",
    border:"rgba(255,255,255,0.8)", glow:"0 0 0 2px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.3)",
    accent:"#fff", badge:"rgba(255,255,255,0.1)",
  };
  return TIER_COLORS[tier] || TIER_COLORS.UNWRITTEN;
}

// Legacy alias so existing heatToColor references keep working
function heatToColor(heat, isSelected) {
  if (isSelected) return { bg:"rgba(255,255,255,0.15)", text:"#fff", border:"rgba(255,255,255,0.7)", glow:"0 0 20px rgba(255,255,255,0.3)" };
  if (heat >= 10) return TIER_COLORS.SACRED;
  if (heat >= 8)  return TIER_COLORS.LEGEND;
  if (heat >= 5)  return TIER_COLORS.RISING;
  return TIER_COLORS.UNWRITTEN;
}

function tierLabel(tier) {
  if (tier === TIER.SACRED)    return "o SACRED - RETIRED LEAGUE-WIDE";
  if (tier === TIER.LEGEND)    return "* LEGEND";
  if (tier === TIER.RISING)    return "ACTIVE";
  return "o UNWRITTEN";
}

export default function WornNumbers() {
  const [selected, setSelected] = useState(null);
  const [sport, setSport]       = useState("ALL");
  const [hovered, setHovered]   = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 700);
      setIsDesktop(window.innerWidth >= 960);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filteredPlayers = (num) => {
    const d = NUMBER_DATA[num];
    if (!d || !d.players) return [];
    if (sport === "ALL") return d.players;
    return d.players.filter(p => p.sport === sport);
  };

  const visibleHeat = (num) => {
    const d = NUMBER_DATA[num];
    if (!d) return 0;
    if (sport === "ALL") return tierHeat[d.tier] || 0;
    const fp = filteredPlayers(num);
    if (!fp.length) return 0;
    return tierHeat[d.tier] || 0;
  };

  const selectedData    = selected !== null ? NUMBER_DATA[selected] : null;
  const selectedPlayers = selected !== null ? filteredPlayers(selected) : [];
  const selectedContent = selected !== null ? CARD_CONTENT[selected] : null;
  const selectedTier    = selectedData?.tier || TIER.UNWRITTEN;
  const selectedColors  = tierColors(selectedTier, false);
  const selectedAccent  = selectedColors.accent;


  // -- GRID CELL RENDERER --------------------------------------------------
  const renderCell = (num) => {
    const tier      = NUMBER_DATA[num]?.tier || TIER.UNWRITTEN;
    const allP      = NUMBER_DATA[num]?.players || [];
    const filtP     = filteredPlayers(num);
    const hasP      = filtP.length > 0;
    const dimmed    = sport !== "ALL" && !hasP;
    const playerCount = sport === "ALL" ? allP.length : filtP.length;
    const isSelected  = selected === num;
    const sacredSport = NUMBER_DATA[num]?.sacredSport;
    const sacredActive = tier === TIER.SACRED && (sport === "ALL" || sport === sacredSport);
    const effectiveTier = sacredActive ? tier : (tier === TIER.SACRED ? TIER.LEGEND : tier);

    let colors;
    if (dimmed && !isSelected) {
      colors = { ...TIER_COLORS.UNWRITTEN, glow: "none" };
    } else {
      const base = tierColors(effectiveTier, isSelected);
      colors = base;
      if (effectiveTier === TIER.LEGEND && !isSelected) {
        if (playerCount >= 3) {
          colors = { ...base, bg:"rgba(210,60,0,0.6)", text:"rgba(255,185,100,1)", border:"rgba(255,100,20,0.85)", glow:"0 0 16px rgba(255,100,20,0.65),0 0 32px rgba(255,80,0,0.3)" };
        } else if (playerCount === 2) {
          colors = { ...base, bg:"rgba(205,55,0,0.52)", text:"rgba(255,165,80,1)", border:"rgba(255,90,10,0.7)", glow:"0 0 14px rgba(255,90,10,0.52),0 0 28px rgba(255,80,0,0.2)" };
        }
      }
    }

    return (
      <div
        key={num}
        className="cell grid-cell-in"
        style={{
          animationDelay: `${num * 5}ms`,
          aspectRatio: "1",
          background: colors.bg,
          borderColor: colors.border,
          boxShadow: isSelected ? `0 0 0 2px ${colors.accent}, ${colors.glow}` : colors.glow,
          color: colors.text,
          fontFamily: "'Bebas Neue',Impact,sans-serif",
          letterSpacing: 1,
          cursor: "pointer",
        }}
        onClick={() => setSelected(selected === num ? null : num)}
        onMouseEnter={() => setHovered(num)}
        onMouseLeave={() => setHovered(null)}
      >
        <span className="cell-label">{num}</span>
      </div>
    );
  };

  // -- PANEL CONTENT RENDERER -----------------------------------------------
  const renderPanelContent = () => {
    if (selected === null) return null;
    const content = CARD_CONTENT[selected];
    const selPlayers = selectedPlayers;

    if (content) {
      return (
        <div>
          {content.stacks && content.stacks.map((stack, si) => (
            <div key={si} style={{ marginBottom: si < content.stacks.length - 1 ? 24 : 0 }}>
              {content.stacks.length > 1 && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.4)" }}>{stack.sport}</span>
                </div>
              )}
              <p style={{ margin:"0 0 10px", fontSize:14, lineHeight:1.65, color:"rgba(255,255,255,0.78)", fontFamily:"Georgia,serif" }}>
                {stack.body}
              </p>
              {stack.connector && (
                <p style={{ margin:"0 0 10px", fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.5)", fontStyle:"italic", borderLeft:`2px solid ${selectedAccent}`, paddingLeft:10 }}>
                  {stack.connector}
                </p>
              )}
              {stack.waitWhat && (
                <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 12px", marginTop:8 }}>
                  <div style={{ fontSize:9, letterSpacing:3, fontFamily:"'Share Tech Mono',monospace", color:selectedAccent, marginBottom:6 }}>WAIT, WHAT?</div>
                  <p style={{ margin:0, fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.6)", fontFamily:"Georgia,serif" }}>{stack.waitWhat}</p>
                </div>
              )}
            </div>
          ))}
          {content.sacredLine && (
            <div style={{ marginTop:4, padding:"12px 16px", borderRadius:8, background:"rgba(200,220,255,0.06)", border:"1px solid rgba(200,220,255,0.2)", textAlign:"center" }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:2, color:"#C8DCFF" }}>{content.sacredLine}</span>
            </div>
          )}
        </div>
      );
    }

    if (selectedData?.tier === TIER.UNWRITTEN) {
      return (
        <div style={{ padding:"24px 0 16px" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div className="bebas" style={{ fontSize:18, letterSpacing:3, color:"rgba(255,255,255,0.18)", marginBottom:16 }}>
              #{selected} - UNWRITTEN
            </div>
            <p style={{ fontSize:22, lineHeight:1.4, margin:"0 auto", maxWidth:320, color:"rgba(255,255,255,0.7)", fontFamily:"'Bebas Neue',Impact,sans-serif", letterSpacing:1 }}>
              This one hasn't found its legend
            </p>
            <p style={{ fontSize:22, lineHeight:1.4, margin:"4px auto 0", maxWidth:320, fontFamily:"'Bebas Neue',Impact,sans-serif", letterSpacing:1, color:"rgba(255,255,255,0.32)" }}>
              Yet.
            </p>
          </div>
          <div style={{ textAlign:"center", marginBottom:28, fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.2)", lineHeight:1.7 }}>
            NO LEGEND HAS CLAIMED #{selected}<br/>
            ACROSS HOCKEY - BASKETBALL - FOOTBALL - BASEBALL - SOCCER
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:20, textAlign:"center" }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.2)", marginBottom:10 }}>
              THINK WE MISSED SOMEONE?
            </div>
            <button
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"9px 20px", fontFamily:"'Share Tech Mono',monospace", fontSize:12, letterSpacing:2, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}
              onClick={() => alert("Community nominations coming soon - nominate a legend for #" + selected + ".")}
            >
              NOMINATE A LEGEND -&gt;
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {selPlayers.length > 0 ? selPlayers.map((p, i) => (
          <div key={i} className="player-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:24 }}>{p.icon}</span>
                <div>
                  <div className="bebas" style={{ fontSize:20, letterSpacing:2, lineHeight:1, marginBottom:2 }}>{p.name}</div>
                  <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontFamily:"'Share Tech Mono',monospace", color:"rgba(255,255,255,0.35)", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:4, padding:"1px 6px", letterSpacing:1 }}>{p.sport}{p.league && p.league !== p.sport ? ` · ${p.league}` : ""}</span>
                    {p.team && (
                      <span style={{ fontSize:10, fontFamily:"'Share Tech Mono',monospace", color:"rgba(255,255,255,0.65)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:4, padding:"1px 7px", letterSpacing:1, fontWeight:600 }}>{p.team}</span>
                    )}
                    {p.status === "Active" && (
                      <span style={{ fontSize:9, fontFamily:"'Share Tech Mono',monospace", color:"#8FD920", background:"rgba(143,217,32,0.1)", border:"1px solid rgba(143,217,32,0.3)", borderRadius:4, padding:"1px 6px", letterSpacing:1 }}>ACTIVE</span>
                    )}
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:"'Share Tech Mono',monospace" }}>{p.era}</span>
                    <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'Share Tech Mono',monospace" }}>{p.role}</span>
                  </div>
                </div>
              </div>
              {p.stat && p.stat !== "-" && (
                <div style={{ textAlign:"right" }}>
                  <div className="stat-num" style={{ color:selectedColors.text, textShadow:`0 0 12px ${selectedColors.border}` }}>{p.stat}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, maxWidth:140, textAlign:"right", lineHeight:1.3 }}>{p.statLabel}</div>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div style={{ textAlign:"center", padding:"30px 0", color:"rgba(255,255,255,0.2)", fontFamily:"'Share Tech Mono',monospace", fontSize:13 }}>
            {sport !== "ALL" ? `No ${sport} legends for #${selected}` : `No legend data for #${selected}`}
          </div>
        )}
      </div>
    );
  };

  // -- PANEL HEADER ---------------------------------------------------------
  const renderPanelHeader = () => {
    if (selected === null) return null;
    return (
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div className="bebas" style={{ fontSize:64, lineHeight:1, letterSpacing:2, color:selectedColors.text, textShadow:`0 0 30px ${selectedColors.border}` }}>
            #{selected}
          </div>
          <div>
            <div className="mono" style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.35)", marginBottom:4, whiteSpace:"nowrap" }}>
              {sport === "ALL" ? "ALL SPORTS" : sport} - JERSEY NUMBER
            </div>
            <div className="bebas" style={{ fontSize:16, letterSpacing:1, color:"rgba(255,255,255,0.7)", lineHeight:1.2 }}>
              {selectedData?.tier === TIER.SACRED   ? "SACRED" :
               selectedData?.tier === TIER.LEGEND   ? `${selectedPlayers.length} LEGEND${selectedPlayers.length !== 1 ? "S" : ""} WORE THIS` :
               selectedData?.tier === TIER.RISING   ? "ACTIVE" :
               "UNWRITTEN"}
            </div>
            {selectedData?.tier === TIER.SACRED && (
              <div style={{ display:"inline-block", marginTop:4, background:"rgba(200,220,255,0.1)", border:"1px solid rgba(200,220,255,0.35)", borderRadius:6, padding:"2px 8px", fontSize:10, color:"#C8DCFF", fontFamily:"'Share Tech Mono',monospace", letterSpacing:2 }}>SACRED</div>
            )}
            {selectedData?.tier === TIER.RISING && (
              <div style={{ display:"inline-block", marginTop:4, background:"rgba(120,220,20,0.1)", border:"1px solid rgba(120,220,20,0.3)", borderRadius:6, padding:"2px 8px", fontSize:10, color:"#8FD920", fontFamily:"'Share Tech Mono',monospace", letterSpacing:2 }}>ACTIVE</div>
            )}
          </div>
        </div>
        <button className="close-btn" onClick={() => setSelected(null)}>X</button>
      </div>
    );
  };

  // -- MAIN RETURN ----------------------------------------------------------
  return (
    <div style={{ minHeight:"100vh", background:"#080c10", color:"white", fontFamily:"'Courier New',monospace", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&display=swap');
        * { box-sizing:border-box; }
        html, body { margin:0; padding:0; overflow-x:hidden; -webkit-text-size-adjust:100%; }
        .bebas { font-family:'Bebas Neue',Impact,sans-serif; }
        .mono  { font-family:'Share Tech Mono','Courier New',monospace; }
        body::after {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:999;
          background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px);
        }
        .cell {
          border-radius:6px; cursor:pointer; display:flex; align-items:center;
          justify-content:center; font-weight:900; transition:transform 0.15s ease,box-shadow 0.15s ease;
          position:relative; border:1px solid; user-select:none;
        }
        .cell:hover { transform:scale(1.18) !important; z-index:10; }
        .sport-pill {
          border-radius:20px; padding:6px 14px; font-size:12px; cursor:pointer;
          border:1px solid; transition:all 0.2s; font-weight:700; letter-spacing:1px;
        }
        .sport-pill:hover { transform:translateY(-2px); }
        .player-card {
          border-radius:12px; padding:14px 16px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04);
          transition:all 0.2s; animation:cardIn 0.3s ease both;
        }
        .player-card:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); transform:translateX(4px); }
        .written-card {
          border-radius:12px; padding:18px 16px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.04);
          animation:cardIn 0.3s ease both;
        }
        @keyframes cardIn   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes panelIn  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes cellIn   { from{opacity:0;transform:scale(0.7)}       to{opacity:1;transform:scale(1)} }
        .panel-in { animation:panelIn 0.35s ease both; }
        .stat-num { font-family:'Bebas Neue',Impact,sans-serif; font-size:28px; line-height:1; }
        .close-btn {
          background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2);
          border-radius:8px; color:rgba(255,255,255,0.6); cursor:pointer;
          padding:6px 12px; font-size:12px; transition:all 0.2s;
          font-family:'Share Tech Mono',monospace; white-space:nowrap;
        }
        .close-btn:hover { background:rgba(255,255,255,0.15); color:white; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:2px; }
        .wordmark { font-size:28px; letter-spacing:3px; }
        .subtext  { font-size:9px; letter-spacing:3px; }
        .grid-wrap { display:grid; grid-template-columns:repeat(9,1fr); gap:3px; }
        .cell-label { font-size:11px; }
        .panel-number { font-size:56px; }
        .panel-wrap { padding:16px 14px; }
        .sport-filter-wrap {
          display:flex; gap:5px; overflow-x:auto;
          scrollbar-width:none; -ms-overflow-style:none; padding-bottom:2px;
        }
        .sport-filter-wrap::-webkit-scrollbar { display:none; }
        .tier-key { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
        .bottom-sheet {
          position:fixed; bottom:0; left:0; right:0;
          background:#0d1117;
          border-top:1px solid rgba(255,255,255,0.12);
          border-radius:20px 20px 0 0;
          z-index:200; max-height:72vh; overflow-y:auto;
          padding:0 16px 40px;
          transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
          -webkit-overflow-scrolling:touch;
        }
        .sheet-handle {
          width:36px; height:4px; border-radius:2px;
          background:rgba(255,255,255,0.2); margin:12px auto 16px;
        }
        .sheet-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.5);
          z-index:199; backdrop-filter:blur(2px);
        }
        .desktop-layout { display:flex; height:calc(100vh - 116px); }
        .desktop-grid-col {
          flex:0 0 61.8%; overflow-y:auto; padding:16px 14px;
          border-right:1px solid rgba(255,255,255,0.06);
        }
        .desktop-panel-col { flex:0 0 38.2%; overflow-y:auto; padding:20px; display:flex; flex-direction:column; }
        @media (min-width:480px) {
          .grid-wrap { grid-template-columns:repeat(10,1fr); gap:4px; }
          .cell-label { font-size:12px; }
        }
        @media (min-width:700px) {
          .wordmark { font-size:36px; letter-spacing:4px; }
          .subtext  { font-size:10px; letter-spacing:4px; }
          .grid-wrap { grid-template-columns:repeat(11,1fr); gap:5px; }
          .panel-number { font-size:80px; }
          .panel-wrap { padding:22px 20px; }
        }
        @media (min-width:960px) {
          .wordmark { font-size:40px; }
          .grid-wrap { grid-template-columns:repeat(11,1fr); gap:6px; }
          .panel-number { font-size:96px; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"12px 14px 10px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ textAlign:"center", marginBottom:10 }}>
          <div className="mono subtext" style={{ color:"rgba(255,255,255,0.3)", marginBottom:2 }}>LEGENDS LIVE HERE</div>
          <h1 className="bebas wordmark" style={{ margin:0, lineHeight:1 }}>THE NUMBER WALL</h1>
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:14, flexWrap:"wrap", fontSize:10, fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, marginBottom:10 }}>
          {[
            { label:"SACRED",    tier:TIER.SACRED },
            { label:"LEGEND",    tier:TIER.LEGEND },
            { label:"ACTIVE",    tier:TIER.RISING },
            { label:"UNWRITTEN", tier:TIER.UNWRITTEN },
          ].map(({ label, tier: t }) => {
            const c = TIER_COLORS[t];
            return (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:c.bg, border:`1px solid ${c.border}`, boxShadow:c.glow }} />
                <span style={{ color:c.text, opacity:0.75 }}>{label}</span>
              </div>
            );
          })}
        </div>
        <div className="sport-filter-wrap" style={{ justifyContent:"center" }}>
          {SPORTS.map(s => {
            const active = sport === s;
            const tab = active ? SPORT_TAB.active : SPORT_TAB.inactive;
            return (
              <button key={s} className="sport-pill"
                style={{ background:tab.bg, borderColor:tab.border, color:tab.color, boxShadow:tab.glow, flexShrink:0 }}
                onClick={() => setSport(s)}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      {isDesktop ? (
        <div className="desktop-layout">
          <div className="desktop-grid-col">
            <div className="grid-wrap">
              {Array.from({ length: 99 }, (_, i) => renderCell(i + 1))}
            </div>
            {selected === null && (
              <div style={{ textAlign:"center", marginTop:20, fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:3 }}>
                <span style={{ color:"rgba(255,255,255,0.25)" }}>PICK A NUMBER.</span>
              </div>
            )}
          </div>
          <div className="desktop-panel-col">
            {selected === null ? (
              <div style={{ margin:"auto", textAlign:"center", padding:"40px 20px" }}>
                <div className="bebas" style={{ fontSize:48, color:"rgba(255,255,255,0.06)", letterSpacing:4, lineHeight:1, marginBottom:16 }}>
                  THE NUMBER<br/>WALL
                </div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:3, color:"rgba(255,255,255,0.2)" }}>
                  PICK A NUMBER TO<br/>MEET ITS LEGENDS
                </div>
              </div>
            ) : (
              <div className="panel-in panel-wrap" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${selectedColors.border}`, borderRadius:16, boxShadow:`0 0 40px ${selectedColors.border}22` }}>
                {renderPanelHeader()}
                {renderPanelContent()}
              </div>
            )}
          </div>
        </div>
      ) : (

        <div style={{ padding:"10px 8px", overflowX:"hidden", maxWidth:"100vw" }}>
          <div className="grid-wrap">
            {Array.from({ length: 99 }, (_, i) => renderCell(i + 1))}
          </div>
          {selected === null && (
            <div style={{ textAlign:"center", marginTop:16, fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:3 }}>
              <span style={{ color:"rgba(255,255,255,0.3)" }}>PICK A NUMBER.</span>
            </div>
          )}
        </div>
      )}

      {/* MOBILE BOTTOM SHEET */}
      {!isDesktop && selected !== null && (
        <div>
          <div className="sheet-overlay" onClick={() => setSelected(null)} />
          <div className="bottom-sheet" ref={sheetRef}>
            <div className="sheet-handle" />
            {renderPanelHeader()}
            <div style={{ border:`1px solid ${selectedColors.border}22`, borderRadius:12, padding:"14px 12px", background:"rgba(255,255,255,0.02)" }}>
              {renderPanelContent()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
